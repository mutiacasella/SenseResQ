import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import type { Volunteer, VolunteerStatus } from '../types/volunteer';
import type { Alert } from '../types/alert';
import { GlobalSystemStatus } from './components/GlobalSystemStatus';
import { VolunteerSummaryList } from './components/VolunteerSummaryList';
import { GPSLocationTracking } from './components/GPSLocationTracking';
import { VitalSignMonitoring } from './components/VitalSignMonitoring';
import { FallDetectionStatus } from './components/FallDetectionStatus';
import { AlertWarningSystem } from './components/AlertWarningSystem';
import { AddVolunteerModal } from './components/AddVolunteerModal';
import { DeleteVolunteerModal } from './components/DeleteVolunteerModal';
import { EditVolunteerModal } from './components/EditVolunteerModal';
import { getVolunteers } from './services/volunteer.service';
import { getAlerts } from './services/alert.service';
import api from './services/api';

const WEARABLE_TIMEOUT_MS = 5000; // Ambang Lost: 5 detik sejak paket monitoring terakhir diterima

const STATUS_PRIORITY: Record<VolunteerStatus, number> = {
  Emergency: 0, Critical: 1, 'High Risk': 2, Warning: 3, Normal: 4, 'No Data': 5,
};

// Dev: Vite (5173) terhubung ke backend (7777). Build: socket same-origin
const socket = import.meta.env.DEV
  ? io(import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:7777')
  : io();

type Health = {
  database: 'connected' | 'disconnected';
  serial: { status: 'connected' | 'disconnected' | 'mock'; port: string };
};

export default function App() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  // Status koneksi dihitung per penugasan perangkat, bukan per ID perangkat
  const [lastReceivedAt, setLastReceivedAt] = useState<Record<string, number>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [health, setHealth] = useState<Health | null>(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(socket.connected);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [volunteerToDelete, setVolunteerToDelete] = useState<Volunteer | null>(null);
  const [volunteerToEdit, setVolunteerToEdit] = useState<Volunteer | null>(null);

  const refreshVolunteers = useCallback(async () => {
    const data = (await getVolunteers()) as Volunteer[];
    setVolunteers(data);
  
    const now = Date.now();
    setLastReceivedAt((previous) => {
      const next = { ...previous };
      for (const vol of data) {
        const age = vol.last_received_age_ms;
        if (typeof age !== 'number' || !Number.isFinite(age) || age < 0) continue;
        const received = now - age;
        if (next[String(vol.assignment_id)] === undefined || next[String(vol.assignment_id)] < received) {
          next[String(vol.assignment_id)] = received;
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const initialLoad = async () => {
      try {
        await Promise.all([refreshVolunteers(), getAlerts().then((data) => setAlerts(data))]);
      } catch (error) { console.error('Gagal mengambil data awal:', error); }
      finally { setLoading(false); }
    };
    void initialLoad();

    const checkHealth = async () => {
      try {
        const response = await api.get('/health');
        setHealth(response.data as Health);
        setApiConnected(true);
      } catch { setApiConnected(false); setHealth(null); }
    };
    void checkHealth();
    const healthTimer = setInterval(() => void checkHealth(), 3000);
    const clockTimer = setInterval(() => setCurrentTime(Date.now()), 1000);

    const onMonitor = (newData: Partial<Volunteer> & {device_id: string; severity: VolunteerStatus}) => {
      // Berlaku untuk paket LoRa asli dan simulator karena keduanya memakai monitoring:new
      if (newData.assignment_id == null) return;
      setLastReceivedAt((previous) => ({ ...previous, [String(newData.assignment_id)]: Date.now() }));
      setVolunteers((current) => current.map((vol) => vol.assignment_id === newData.assignment_id ? {
        ...vol,
        ...newData,
        status: newData.severity,
        connection_status: 'Connected',
      } : vol));
    };
    const onAlert = (newAlert: Alert) => setAlerts((current) => [newAlert, ...current]);
    const onConnect = () => {
      setRealtimeConnected(true);
      void refreshVolunteers().catch(console.error);
      void getAlerts().then((data) => setAlerts(data)).catch(console.error);
    };
    const onDisconnect = () => setRealtimeConnected(false);
    socket.on('monitoring:new', onMonitor);
    socket.on('alert:new', onAlert);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      clearInterval(healthTimer); clearInterval(clockTimer);
      socket.off('monitoring:new', onMonitor);
      socket.off('alert:new', onAlert);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [refreshVolunteers]);

  const withConnectivity = volunteers.map((vol) => {
    const lastArrival = lastReceivedAt[String(vol.assignment_id)];
    if (lastArrival === undefined) {
      return { ...vol, connection_status: vol.timestamp ? 'Lost' as const : 'Awaiting Data' as const };
    }
    // State waktu bisa tertinggal <1 detik dari event baru
    const ageMs = Math.max(0, currentTime - lastArrival);
    return { ...vol, connection_status: ageMs < WEARABLE_TIMEOUT_MS ? 'Connected' as const : 'Lost' as const };
  });
  const sortedVolunteers = [...withConnectivity].sort((a,b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]);
  const selectedVolunteer = withConnectivity.find((v) => v.volunteer_id === selectedVolunteerId) ?? withConnectivity[0];
  const effectiveSelectedId = selectedVolunteer?.volunteer_id ?? '';
  const activeVolunteers = withConnectivity.filter((v) => v.connection_status === 'Connected').length;

  const gpsData = withConnectivity.reduce((acc, volunteer) => {
    if (volunteer.timestamp && volunteer.x !== null && volunteer.y !== null
      && Number.isFinite(volunteer.x) && Number.isFinite(volunteer.y)) {
      acc[volunteer.volunteer_id] = {
        x: volunteer.x, y: volunteer.y,
        lastUpdate: new Date(volunteer.timestamp).toLocaleTimeString('id-ID'),
      };
    }
    return acc;
  }, {} as Record<string, {x: number; y: number; lastUpdate: string}>);

  const vitalData = {
    heartRate: selectedVolunteer?.heart_rate ?? null,
    spo2: selectedVolunteer?.spo2 ?? null,
    temperature: selectedVolunteer?.temperature ?? null,
    timestamp: selectedVolunteer?.timestamp ? new Date(selectedVolunteer.timestamp).toLocaleTimeString('id-ID') : '—',
    connectionStatus: selectedVolunteer?.connection_status ?? 'Awaiting Data' as const,
  };

  const sortedAlerts = [...alerts].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const afterDeleted = async () => {
    await refreshVolunteers();
    setSelectedVolunteerId((current) => current === volunteerToDelete?.volunteer_id ? '' : current);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-[1800px] mx-auto">
        <header className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl text-gray-900 mb-1">SENSERESQ</h1>
            <p className="text-sm text-gray-600">Dashboard Monitoring Relawan Bencana</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">+ Daftarkan Relawan</button>
        </header>

        {!apiConnected && <p role="alert" className="mb-3 p-3 rounded bg-red-100 text-red-800">Tidak dapat terhubung ke backend. Periksa apakah aplikasi sedang berjalan.</p>}
        {apiConnected && health?.database === 'disconnected' && <p role="alert" className="mb-3 p-3 rounded bg-red-100 text-red-800">Database MySQL tidak terhubung. Data monitoring belum dapat disimpan atau dimuat.</p>}
        {apiConnected && !realtimeConnected && <p role="alert" className="mb-3 p-3 rounded bg-yellow-100 text-yellow-900">Koneksi pembaruan langsung (Socket.IO) terputus.</p>}
        {health?.serial.status === 'mock' && <p className="mb-3 p-2 rounded bg-yellow-100 text-yellow-900 text-sm">MODE SIMULASI - Tidak terhubung ke receiver serial fisik.</p>}
        {loading && <p className="mb-3 text-sm text-gray-600">Memuat data awal…</p>}

        <div className="space-y-3">
          <GlobalSystemStatus activeVolunteers={activeVolunteers} gatewayStatus={health?.serial.status ?? 'unknown'} totalAlerts={alerts.length} />
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-3">
            <VolunteerSummaryList volunteers={sortedVolunteers} selectedVolunteerId={effectiveSelectedId} onSelectVolunteer={setSelectedVolunteerId} onRequestDelete={setVolunteerToDelete} onRequestEdit={setVolunteerToEdit} />
            <GPSLocationTracking volunteers={withConnectivity} gpsData={gpsData} selectedVolunteerId={effectiveSelectedId} onSelectVolunteer={setSelectedVolunteerId} />
          </div>
          <VitalSignMonitoring volunteerName={selectedVolunteer?.name ?? ''} vitalData={vitalData} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <FallDetectionStatus
              volunteerName={selectedVolunteer?.name ?? ''}
              fallDetected={selectedVolunteer?.fall_detected == null ? null : Boolean(selectedVolunteer.fall_detected)}
              dataStatus={selectedVolunteer?.connection_status ?? 'Awaiting Data'}
              fallTime={selectedVolunteer?.fall_detected && selectedVolunteer.timestamp ? new Date(selectedVolunteer.timestamp).toLocaleTimeString('id-ID') : undefined}
            />
            <AlertWarningSystem alerts={sortedAlerts} />
          </div>
        </div>
      </div>
      {showAdd && <AddVolunteerModal onClose={() => setShowAdd(false)} onCreated={refreshVolunteers} />}
      {volunteerToEdit && <EditVolunteerModal volunteer={volunteerToEdit} onClose={() => setVolunteerToEdit(null)} onUpdated={refreshVolunteers} />}
      {volunteerToDelete && <DeleteVolunteerModal volunteer={volunteerToDelete} onClose={() => setVolunteerToDelete(null)} onDeleted={afterDeleted} />}
    </div>
  );
}
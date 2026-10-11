import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Types
import { Volunteer } from "../types/volunteer";
import type { Alert } from "../types/alert";

// Components
import { GlobalSystemStatus } from './components/GlobalSystemStatus';
import { VolunteerSummaryList } from './components/VolunteerSummaryList';
import { GPSLocationTracking } from './components/GPSLocationTracking';
import { VitalSignMonitoring } from './components/VitalSignMonitoring';
import { FallDetectionStatus } from './components/FallDetectionStatus';
import { AlertWarningSystem } from './components/AlertWarningSystem';

// Services
import { getVolunteers } from "./services/volunteer.service";
import { getAlerts } from "./services/alert.service";

// Mapping tingkat prioritas status relawan untuk pengurutan
const STATUS_PRIORITY = {
  Emergency: 0,
  Critical: 1,
  "High Risk": 2,
  Warning: 3,
  Normal: 4,
};

// Inisialisasi koneksi Socket.io ke backend
const socket = io("http://localhost:7777");

// Komponen utama aplikasi dashboard pemantauan kesehatan relawan bencana
export default function App() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('VOL003');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    getVolunteers()
      .then((data) => {
        console.log("Volunteers:", data);
        setVolunteers(data);
      })
      .catch((error) => {
        console.error(error);
      });

    getAlerts()
      .then((data) => {
        console.log("Alerts:", data);
        setAlerts(data);
      })
      .catch((error) => {
        console.error(error);
      });

    // Timer 1: update currentTime tiap 1 detik
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Timer 2: update connection_status tiap 5 detik
    const connectionInterval = setInterval(() => {
      setVolunteers((prev) =>
        prev.map((vol) => {
          const now = new Date();
          const lastUpdate = new Date(vol.timestamp);
          const diffSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;
          return {
            ...vol,
            connection_status: diffSeconds <= 15 ? "Connected" : "Lost",
          };
        })
      );
    }, 5000);

    // Mendengarkan data monitoring real-time dari WebSocket backend
    socket.on("monitoring:new", (newData) => {
      console.log("MONITORING WEBSOCKET:", newData);
      
      setVolunteers((prevVolunteers) =>
        prevVolunteers.map((vol) => {
          if (vol.device_id === newData.device_id) {
            return {
              ...vol,
              heart_rate: newData.heart_rate,
              spo2: newData.spo2,
              temperature: newData.temperature,
              x: newData.x,
              y: newData.y,
              fall_detected: newData.fall_detected,
              activity_status: newData.activity_status,
              fatigue_score: newData.fatigue_score,
              status: newData.severity ?? vol.status,
              timestamp: newData.timestamp,
              connection_status: "Connected",
            };
          }
          return vol;
        })
      );
    });

    // Mendengarkan alert baru real-time dari WebSocket backend
    socket.on("alert:new", (newAlert) => {
      setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
    });

    return () => {
      clearInterval(clockInterval);
      clearInterval(connectionInterval);
      socket.off("monitoring:new");
      socket.off("alert:new");
    };
  }, []);

  // Membentuk data koordinat GPS berdasarkan properti x dan y dari data relawan
  const gpsData = volunteers.reduce((acc, volunteer) => {
    acc[volunteer.volunteer_id] = {
      x: volunteer.x ?? 50,
      y: volunteer.y ?? 50,
      lastUpdate: volunteer.timestamp ? new Date(volunteer.timestamp).toLocaleTimeString("id-ID") : '-'
    };
    return acc;
  }, {} as Record<string, { x: number; y: number; lastUpdate: string }>);

  // Mengurutkan daftar relawan berdasarkan tingkat prioritas status
  const sortedVolunteers = [...volunteers].sort(
    (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
  );

  // Menentukan relawan yang sedang dipilih atau kembali ke data relawan pertama
  const selectedVolunteer = volunteers.find(v => v.volunteer_id === selectedVolunteerId) || volunteers[0];

  // Menghitung jumlah relawan yang status koneksinya terhubung
  const activeVolunteers = volunteers.filter(v => v.connection_status === "Connected").length;

  // Menyusun data tanda vital untuk relawan yang sedang dipilih
  const vitalData = {
    heartRate: selectedVolunteer ? selectedVolunteer.heart_rate : 0,
    spo2: selectedVolunteer ? selectedVolunteer.spo2 : 0,
    temperature: selectedVolunteer ? selectedVolunteer.temperature : 0,
    timestamp: selectedVolunteer?.timestamp ? new Date(selectedVolunteer.timestamp).toLocaleTimeString('id-ID') : '-'
  };

  // Mengurutkan daftar alert berdasarkan waktu terbaru (descending)
  const sortedAlerts = [...alerts].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Menghapus atau menutup alert tertentu berdasarkan id
  const handleDismissAlert = (alertId: number) => {
    setAlerts(alerts.filter(a => a.alert_id !== alertId));
  };

  const gatewayStatus = activeVolunteers > 0 ? "connected" : "disconnected";

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-3">
          <h1 className="text-3xl text-gray-900 mb-1">SENSERESQ</h1>
          <p className="text-sm text-gray-600">Dashboard Monitoring Relawan Bencana</p>
        </div>

        <div className="space-y-3">
          <GlobalSystemStatus
            activeVolunteers={activeVolunteers}
            gatewayStatus={gatewayStatus}
            totalAlerts={alerts.length}
          />

          <div className="grid grid-cols-2 gap-3">
            <VolunteerSummaryList
              volunteers={sortedVolunteers}
              selectedVolunteerId={selectedVolunteerId}
              onSelectVolunteer={setSelectedVolunteerId}
            />

            <GPSLocationTracking
              volunteers={volunteers}
              gpsData={gpsData}
              selectedVolunteerId={selectedVolunteerId}
              onSelectVolunteer={setSelectedVolunteerId}
            />
          </div>

          <VitalSignMonitoring
            volunteerName={selectedVolunteer ? selectedVolunteer.name : ''}
            vitalData={vitalData}
          />

          <div className="grid grid-cols-2 gap-3">
            <FallDetectionStatus
              volunteerName={selectedVolunteer ? selectedVolunteer.name : ''}
              fallDetected={selectedVolunteer ? Boolean(selectedVolunteer.fall_detected) : false}
              fallTime={selectedVolunteer?.fall_detected && selectedVolunteer.timestamp ? new Date(selectedVolunteer.timestamp).toLocaleTimeString('id-ID') : undefined}
            />

            <AlertWarningSystem
              alerts={sortedAlerts}
              onDismissAlert={handleDismissAlert}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
import { Activity, Wifi, AlertTriangle } from 'lucide-react';
interface Props {
  activeVolunteers: number;
  gatewayStatus: 'connected' | 'disconnected' | 'mock' | 'unknown';
  totalAlerts: number;
}
export function GlobalSystemStatus({ activeVolunteers, gatewayStatus, totalAlerts }: Props) {
  const statusLabel = gatewayStatus === 'connected' ? 'Connected'
    : gatewayStatus === 'disconnected' ? 'Disconnected'
    : gatewayStatus === 'mock' ? 'Mode Simulasi' : 'Belum diketahui';
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <div><p className="text-gray-500 text-xs">Relawan Mengirim Data</p><p className="text-2xl mt-1">{activeVolunteers}</p></div>
        <Activity className="w-8 h-8 text-blue-500" />
      </div>
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <div><p className="text-gray-500 text-xs">Status Receiver USB/Serial</p>
          <p className={`mt-1 ${gatewayStatus === 'connected' ? 'text-green-700' : gatewayStatus === 'disconnected' ? 'text-red-700' : 'text-gray-700'}`}>{statusLabel}</p>
        </div>
        <Wifi className={`w-8 h-8 ${gatewayStatus === 'connected' ? 'text-green-500' : 'text-gray-400'}`} />
      </div>
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <div><p className="text-gray-500 text-xs">Total Riwayat Alert</p><p className="text-2xl mt-1">{totalAlerts}</p></div>
        <AlertTriangle className="w-8 h-8 text-orange-500" />
      </div>
    </div>
  );
}
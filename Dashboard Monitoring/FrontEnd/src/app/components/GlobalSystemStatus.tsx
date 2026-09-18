import { Activity, Wifi, AlertTriangle } from 'lucide-react';

interface GlobalSystemStatusProps {
  activeVolunteers: number;
  gatewayStatus: 'connected' | 'error';
  totalAlerts: number;
}

// Komponen untuk menampilkan ringkasan status sistem global secara real-time
export function GlobalSystemStatus({ activeVolunteers, gatewayStatus, totalAlerts }: GlobalSystemStatusProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs">Relawan Aktif</p>
            <p className="text-2xl mt-1">{activeVolunteers}</p>
          </div>
          <Activity className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs">Status Gateway LoRa</p>
            <p className={`mt-1 ${gatewayStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
              {gatewayStatus === 'connected' ? 'Connected' : 'Error'}
            </p>
          </div>
          <Wifi className={`w-8 h-8 ${gatewayStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs">Total Alert Aktif</p>
            <p className="text-2xl mt-1">{totalAlerts}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-orange-500" />
        </div>
      </div>
    </div>
  );
}
import { AlertTriangle, Clock, CheckCircle, HelpCircle } from 'lucide-react';
import type { ConnectionStatus } from '../../types/volunteer';
interface Props {
  volunteerName: string;
  fallDetected: boolean | null;
  fallTime?: string;
  dataStatus: ConnectionStatus;
}
export function FallDetectionStatus({ volunteerName, fallDetected, fallTime, dataStatus }: Props) {
  const unknown = fallDetected === null || dataStatus === 'Awaiting Data';
  const stale = dataStatus === 'Lost';
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-3 border-b"><h2 className="text-lg">Fall Detection {volunteerName ? `- ${volunteerName}` : ''}</h2></div>
      <div className="p-3">
        <div className={`border-2 rounded-lg p-4 ${unknown || stale ? 'border-gray-300 bg-gray-50' : fallDetected ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
          <div className="flex items-center gap-3">
            {unknown || stale ? <HelpCircle className="w-12 h-12 text-gray-500" />
              : fallDetected ? <AlertTriangle className="w-12 h-12 text-red-600" />
                : <CheckCircle className="w-12 h-12 text-green-600" />}
            <div className="flex-1">
              <div className="text-xl mb-1">
                {unknown ? 'Belum ada data deteksi jatuh'
                  : stale ? 'Data terakhir - koneksi Lost'
                    : fallDetected ? 'FALL DETECTED' : 'No Fall Detected'}
              </div>
              {stale && <div className="text-sm text-gray-600">Status terkini tidak dapat dipastikan.</div>}
              {!unknown && !stale && fallDetected && fallTime && <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4" />Waktu data terakhir: {fallTime}</div>}
              {!unknown && !stale && !fallDetected && <div className="text-sm text-gray-600">Tidak ada indikasi jatuh pada data terbaru.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
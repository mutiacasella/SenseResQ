import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface FallDetectionStatusProps {
  volunteerName: string;
  fallDetected: boolean;
  fallTime?: string;
}

// Komponen untuk menampilkan status deteksi jatuh pada relawan terpilih
export function FallDetectionStatus({ volunteerName, fallDetected, fallTime }: FallDetectionStatusProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-3 border-b">
        <h2 className="text-lg">Fall Detection - {volunteerName}</h2>
      </div>
      <div className="p-3">
        <div className={`border-2 rounded-lg p-4 ${fallDetected ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
          <div className="flex items-center gap-3">
            {fallDetected ? (
              <AlertTriangle className="w-12 h-12 text-red-500" />
            ) : (
              <CheckCircle className="w-12 h-12 text-green-500" />
            )}
            <div className="flex-1">
              <div className="text-xl mb-1">
                {fallDetected ? (
                  <span className="text-red-700">FALL DETECTED</span>
                ) : (
                  <span className="text-green-700">No Fall Detected</span>
                )}
              </div>
              {fallDetected && fallTime && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4" />
                  <span>Waktu Kejadian: {fallTime}</span>
                </div>
              )}
              {!fallDetected && (
                <div className="text-sm text-gray-600">Relawan dalam kondisi aman</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
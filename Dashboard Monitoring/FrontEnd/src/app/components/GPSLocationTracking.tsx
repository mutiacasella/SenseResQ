import { MapPin, Clock } from 'lucide-react';
import type { Volunteer, VolunteerStatus } from '../../types/volunteer';

interface GPSLocationTrackingProps {
  volunteers: Volunteer[];
  gpsData: {
    [volunteerId: string]: {
      x: number;
      y: number;
      lastUpdate: string;
    };
  };
  selectedVolunteerId?: string;
  onSelectVolunteer: (id: string) => void;
}

// Konfigurasi warna titik marker peta berdasarkan status relawan
const STATUS_DOT: Record<VolunteerStatus, string> = {
  Emergency: 'bg-red-600',
  Critical: 'bg-red-500',
  "High Risk": 'bg-orange-500',
  Warning: 'bg-yellow-500',
  Normal: 'bg-green-500',
};

// Konfigurasi warna animasi ring radar berdasarkan status
const STATUS_RING: Record<VolunteerStatus, string> = {
  Emergency: 'bg-red-600',
  Critical: 'bg-red-500',
  "High Risk": 'bg-orange-500',
  Warning: 'bg-yellow-400',
  Normal: 'bg-green-500',
};

// Pemetaan teks label status untuk tampilan tooltip
const STATUS_LABEL: Record<VolunteerStatus, string> = {
  Emergency: 'EMERGENCY',
  Critical: 'CRITICAL',
  "High Risk": 'HIGH RISK',
  Warning: 'WARNING',
  Normal: 'Normal',
};

// Komponen untuk melacak dan memvisualisasikan posisi GPS relawan pada peta grid real-time
export function GPSLocationTracking({ volunteers, gpsData, selectedVolunteerId, onSelectVolunteer }: GPSLocationTrackingProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-3 border-b flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        <h2 className="text-lg">GPS Location Tracking</h2>
      </div>
      <div className="p-3">
        <div className="relative bg-gray-50 border-2 border-gray-300 rounded-lg" style={{ height: '400px' }}>
          <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="border border-gray-200" />
            ))}
          </div>

          <div className="absolute inset-0">
            {volunteers.map((volunteer) => {
              const gps = gpsData[volunteer.volunteer_id];
              if (!gps) return null;

              const isSelected = volunteer.volunteer_id === selectedVolunteerId;
              const dotColor = STATUS_DOT[volunteer.status] || 'bg-gray-400';
              const ringColor = STATUS_RING[volunteer.status] || 'bg-gray-400';

              return (
                <div
                  key={volunteer.volunteer_id}
                  className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${gps.x}%`, top: `${gps.y}%` }}
                  onClick={() => onSelectVolunteer(volunteer.volunteer_id)}
                >
                  <div className="relative group">
                    {/* Ring animasi */}
                    <div
                      className={`absolute rounded-full ${ringColor} opacity-30 animate-ping ${
                        volunteer.status === 'Emergency' || volunteer.status === 'Critical' ? '' : 'group-hover:opacity-30 opacity-0'
                      }`}
                      style={{ width: '24px', height: '24px', top: '-4px', left: '-4px' }}
                    />

                    {/* Titik utama marker */}
                    <div
                      className={`rounded-full transition-all ${dotColor} ${
                        isSelected
                          ? 'w-5 h-5 border-[3px] border-white shadow-[0_0_0_3px_#3b82f6,0_2px_8px_rgba(0,0,0,0.35)]'
                          : 'w-4 h-4 border-2 border-white shadow-lg'
                      }`}
                    />

                    {/* Label informasi relawan yang sedang dipilih */}
                    {isSelected && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-blue-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-20 shadow-lg">
                        <div className="font-semibold">{volunteer.name}</div>
                        <div className="text-blue-200">{STATUS_LABEL[volunteer.status]}</div>
                        <div className="flex items-center gap-1 text-blue-300">
                          <Clock className="w-3 h-3" />
                          {gps.lastUpdate}
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-blue-700" />
                      </div>
                    )}

                    {/* Tooltip saat kursor diarahkan ke marker */}
                    {!isSelected && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                        <div>{volunteer.name}</div>
                        <div className="text-gray-300">{STATUS_LABEL[volunteer.status]}</div>
                        <div className="flex items-center gap-1 text-gray-300">
                          <Clock className="w-3 h-3" />
                          {gps.lastUpdate}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="absolute top-2 left-2 bg-white/90 rounded p-2 text-xs space-y-1">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600" /><span className="font-medium">Emergency</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span>Critical</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /><span>High Risk</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span>Warning</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span>Normal</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
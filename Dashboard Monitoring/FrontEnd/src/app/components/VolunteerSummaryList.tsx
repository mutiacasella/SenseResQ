import { Heart, Droplet, Thermometer, Activity, Radio } from 'lucide-react';
import type { Volunteer, VolunteerStatus } from "../../types/volunteer";

interface VolunteerSummaryListProps {
  volunteers: Volunteer[];
  selectedVolunteerId?: string;
  onSelectVolunteer: (id: string) => void;
}

// Konfigurasi gaya tampilan baris dan badge berdasarkan status tingkat keparahan relawan
const STATUS_STYLE: Record<VolunteerStatus, { badge: string; row: string; label: string }> = {
  Emergency: { badge: 'bg-red-100 text-red-800 border-red-400', row: 'bg-red-50', label: 'EMERGENCY' },
  Critical: { badge: 'bg-red-100 text-red-700 border-red-300', row: 'bg-red-50/60', label: 'CRITICAL' },
  "High Risk": { badge: 'bg-orange-100 text-orange-800 border-orange-300', row: 'bg-orange-50/60', label: 'HIGH RISK' },
  Warning: { badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', row: 'bg-yellow-50/60', label: 'WARNING' },
  Normal: { badge: 'bg-green-100 text-green-800 border-green-300', row: '', label: 'NORMAL' },
};

// Konfigurasi warna indikator titik berdasarkan skor kelelahan
const FATIGUE_DOT: Record<number, string> = {
  3: 'bg-red-500',
  2: 'bg-orange-500',
  1: 'bg-yellow-500',
  0: 'bg-green-500',
};

// Komponen untuk menampilkan tabel daftar ringkasan data dan status seluruh relawan
export function VolunteerSummaryList({ volunteers, selectedVolunteerId, onSelectVolunteer }: VolunteerSummaryListProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-3 border-b flex items-center justify-between">
        <h2 className="text-lg">Data Relawan</h2>
        <span className="text-xs text-gray-500">Sorted by priority</span>
      </div>
      <div className="overflow-auto max-h-[400px]">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs text-gray-600">ID / Nama</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600">Status</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600">Fatigue</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600">Heart Rate</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600">SpO₂</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600">Suhu</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600">Aktivitas</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600">LoRa</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {volunteers.map((volunteer) => {
              const isSelected = volunteer.volunteer_id === selectedVolunteerId;
              const style = STATUS_STYLE[volunteer.status];
              const fatigue = volunteer.fatigue_score;

              return (
                <tr
                  key={volunteer.volunteer_id}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-100 ring-2 ring-inset ring-blue-400'
                      : `${style.row} hover:bg-blue-50`
                  }`}
                  onClick={() => onSelectVolunteer(volunteer.volunteer_id)}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                      <div>
                        <div className="text-sm font-medium">{volunteer.name}</div>
                        <div className="text-xs text-gray-500">{volunteer.volunteer_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs border font-semibold ${style.badge}`}>
                      {style.label}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {volunteer.fall_detected ? (
                      <span className="text-xs text-red-600 font-semibold">FALL</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${FATIGUE_DOT[fatigue]}`} />
                        <span className="text-sm">{fatigue}/3</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Heart className={`w-3.5 h-3.5 ${volunteer.heart_rate > 100 ? 'text-red-500' : 'text-red-400'}`} />
                      <span className={`text-sm ${volunteer.heart_rate > 100 ? 'font-semibold text-red-600' : ''}`}>
                        {volunteer.heart_rate} bpm
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Droplet className={`w-3.5 h-3.5 ${volunteer.spo2 < 95 ? 'text-orange-500' : 'text-blue-400'}`} />
                      <span className={`text-sm ${volunteer.spo2 < 95 ? 'font-semibold text-orange-600' : ''}`}>
                        {volunteer.spo2}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Thermometer className={`w-3.5 h-3.5 ${volunteer.temperature > 37.6 ? 'text-red-500' : 'text-orange-400'}`} />
                      <span className={`text-sm ${volunteer.temperature > 37.6 ? 'font-semibold text-red-600' : ''}`}>
                        {volunteer.temperature}°C
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Activity className={`w-3.5 h-3.5 ${volunteer.fall_detected ? 'text-red-600' : volunteer.activity_status === 'aktif' ? 'text-green-600' : 'text-gray-500'}`} />
                      <span className={`text-sm ${volunteer.fall_detected ? 'text-red-600 font-semibold' : volunteer.activity_status === 'aktif' ? 'text-green-600' : 'text-gray-600'}`}>
                        {volunteer.activity_status}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Radio className={`w-3.5 h-3.5 ${volunteer.connection_status === 'Connected' ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`text-sm ${volunteer.connection_status === 'Connected' ? 'text-green-600' : 'text-red-600'}`}>
                        {volunteer.connection_status === 'connected' ? 'OK' : 'Lost'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
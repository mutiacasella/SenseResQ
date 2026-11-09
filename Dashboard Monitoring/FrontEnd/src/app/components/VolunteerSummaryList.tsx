
import { Heart, Droplet, Thermometer, Activity, Radio, Trash2, Pencil } from 'lucide-react';
import type { Volunteer, VolunteerStatus } from "../../types/volunteer";

interface VolunteerSummaryListProps {
  volunteers: Volunteer[];
  selectedVolunteerId?: string;
  onSelectVolunteer: (id: string) => void;
  onRequestDelete: (volunteer: Volunteer) => void;
  onRequestEdit: (volunteer: Volunteer) => void;
}

// Konfigurasi gaya tampilan baris dan badge berdasarkan status tingkat keparahan relawan
const STATUS_STYLE: Record<VolunteerStatus, { badge: string; row: string; label: string }> = {
  Emergency: { badge: 'bg-red-100 text-red-800 border-red-400', row: 'bg-red-50', label: 'EMERGENCY' },
  Critical: { badge: 'bg-red-100 text-red-700 border-red-300', row: 'bg-red-50/60', label: 'CRITICAL' },
  "High Risk": { badge: 'bg-orange-100 text-orange-800 border-orange-300', row: 'bg-orange-50/60', label: 'HIGH RISK' },
  Warning: { badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', row: 'bg-yellow-50/60', label: 'WARNING' },
  Normal: { badge: 'bg-green-100 text-green-800 border-green-300', row: '', label: 'NORMAL' },
  'No Data': { badge: 'bg-gray-100 text-gray-800 border-gray-300', row: '', label: 'BELUM ADA DATA' },
};

// Konfigurasi warna indikator titik berdasarkan skor kelelahan
const FATIGUE_DOT: Record<number, string> = {
  3: 'bg-red-500',
  2: 'bg-orange-500',
  1: 'bg-yellow-500',
  0: 'bg-green-500',
};

// Komponen untuk menampilkan tabel daftar ringkasan data dan status seluruh relawan
export function VolunteerSummaryList({ volunteers, selectedVolunteerId, onSelectVolunteer, onRequestDelete, onRequestEdit }: VolunteerSummaryListProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-3 border-b flex items-center justify-between">
        <h2 className="text-lg">Data Relawan</h2>
        <span className="text-xs text-gray-500">Sorted by priority</span>
      </div>

      <div className="overflow-auto max-h-[400px]">
        <table className="w-full min-w-[1000px] table-fixed">
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '13%' }} />
          </colgroup>

          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-xs text-gray-600">ID / Nama</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600">Status</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600">Fatigue</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600">Heart Rate</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600">SpO₂</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600">Suhu</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600">Aktivitas</th>
              <th className="px-3 py-2 text-center text-xs text-gray-600">LoRa</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {volunteers.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500 text-sm">
                  Belum ada relawan terdaftar. Klik “Daftarkan Relawan” untuk menambahkan data.
                </td>
              </tr>
            )}

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
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-1.5 shrink-0 flex items-center justify-center">
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className="text-sm font-medium truncate"
                          title={volunteer.name}
                        >
                          {volunteer.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {volunteer.volunteer_id}
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-label={`Edit relawan ${volunteer.name}`}
                        title="Edit nama atau perangkat relawan"
                        className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-blue-700 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRequestEdit(volunteer);
                        }}
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Akhiri penugasan ${volunteer.name}`}
                        title="Akhiri penugasan (riwayat tetap tersimpan)"
                        className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRequestDelete(volunteer);
                        }}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>

                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex w-[140px] max-w-full items-center justify-center whitespace-nowrap rounded-full border px-2 py-1 text-xs font-semibold leading-none ${style.badge}`}
                    >
                      {style.label}
                    </span>
                  </td>

                  <td className="px-3 py-2">
                    {volunteer.fall_detected ? (
                      <span className="text-xs text-red-600 font-semibold">FALL</span>
                    ) : (
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className={`w-2.5 h-2.5 shrink-0 rounded-full ${fatigue === null ? "bg-gray-300" : FATIGUE_DOT[fatigue]}`} />
                        <span className="text-sm">
                          {fatigue === null ? "—" : `${fatigue}/3`}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Heart
                        className={`w-3.5 h-3.5 shrink-0 ${(volunteer.heart_rate != null && volunteer.heart_rate > 175) ? 'text-red-500' : 'text-red-400'}`}
                      />
                      <span className={`text-sm tabular-nums ${(volunteer.heart_rate != null && volunteer.heart_rate > 175) ? 'font-semibold text-red-600' : ''}`}>
                        {volunteer.heart_rate == null ? "—" : `${volunteer.heart_rate} bpm`}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Droplet
                        className={`w-3.5 h-3.5 shrink-0 ${(volunteer.spo2 != null && volunteer.spo2 < 95) ? 'text-orange-500' : 'text-blue-400'}`}
                      />
                      <span className={`text-sm tabular-nums ${(volunteer.spo2 != null && volunteer.spo2 < 95) ? 'font-semibold text-orange-600' : ''}`}>
                        {volunteer.spo2 == null ? "—" : `${volunteer.spo2}%`}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Thermometer
                        className={`w-3.5 h-3.5 shrink-0 ${(volunteer.temperature != null && volunteer.temperature > 37.6) ? 'text-red-500' : 'text-orange-400'}`}
                      />
                      <span className={`text-sm tabular-nums ${(volunteer.temperature != null && volunteer.temperature > 37.6) ? 'font-semibold text-red-600' : ''}`}>
                        {volunteer.temperature == null ? "—" : `${volunteer.temperature}°C`}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Activity
                        className={`w-3.5 h-3.5 shrink-0 ${
                          volunteer.fall_detected
                            ? 'text-red-600'
                            : volunteer.activity_status === 'Active'
                              ? 'text-green-600'
                              : 'text-gray-500'
                        }`}
                      />
                      <span
                        className={`text-sm truncate ${
                          volunteer.fall_detected
                            ? 'text-red-600 font-semibold'
                            : volunteer.activity_status === 'Active'
                              ? 'text-green-600'
                              : 'text-gray-600'
                        }`}
                        title={volunteer.activity_status ?? undefined}
                      >
                        {volunteer.activity_status ?? "—"}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-center whitespace-nowrap">
                      <Radio
                        className={`w-3.5 h-3.5 shrink-0 ${
                          volunteer.connection_status === 'Connected'
                            ? 'text-green-500'
                            : volunteer.connection_status === 'Lost'
                              ? 'text-red-500'
                              : 'text-gray-400'
                        }`}
                      />
                      <span
                        className={`text-sm leading-tight whitespace-nowrap ${
                          volunteer.connection_status === 'Connected'
                            ? 'text-green-600'
                            : volunteer.connection_status === 'Lost'
                              ? 'text-red-600'
                              : 'text-gray-500'
                        }`}
                      >
                        {volunteer.connection_status === 'Connected'
                          ? 'Connected'
                          : volunteer.connection_status === 'Lost'
                            ? 'Lost'
                            : 'Menunggu data'}
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
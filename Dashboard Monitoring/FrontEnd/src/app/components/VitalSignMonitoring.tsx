import { Heart, Droplet, Thermometer, Clock } from 'lucide-react';
import type { VitalSignData } from '../../types/vital-sign';
interface Props { volunteerName: string; vitalData: VitalSignData; }
export function VitalSignMonitoring({ volunteerName, vitalData }: Props) {
  const metrics = [
    { label: 'Heart Rate', value: vitalData.heartRate, unit: 'bpm', icon: Heart, normal: (v: number) => v >= 60 && v <= 175, range: '60–175 bpm' },
    { label: 'SpO₂', value: vitalData.spo2, unit: '%', icon: Droplet, normal: (v: number) => v >= 95 && v <= 100, range: '95–100%' },
    { label: 'Suhu Tubuh', value: vitalData.temperature, unit: '°C', icon: Thermometer, normal: (v: number) => v >= 36.4 && v <= 37.6, range: '36.4–37.6°C' },
  ];
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-3 border-b">
        <h2 className="text-lg">Vital Sign Monitoring {volunteerName ? `- ${volunteerName}` : ''}</h2>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5"><Clock className="w-3 h-3" />Last Update: {vitalData.timestamp}
          {vitalData.connectionStatus === 'Lost' && <strong className="text-red-700">(DATA LAMA - LOST)</strong>}
          {vitalData.connectionStatus === 'Awaiting Data' && <span>(Menunggu data pertama)</span>}
        </div>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {metrics.map((m) => {
            const present = m.value !== null && Number.isFinite(m.value);
            const normal = present && m.normal(m.value as number);
            const status = !present ? 'Belum ada data' : normal ? 'Normal' : 'Abnormal';
            return (
              <div key={m.label} className={`border-2 rounded-lg p-3 ${!present || vitalData.connectionStatus === 'Lost' ? 'border-gray-300 bg-gray-50' : normal ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-1"><m.icon className="w-5 h-5 text-gray-600" /><span className="text-xs text-gray-600">{m.label}</span></div>
                <div className="text-2xl mb-1">{present ? m.value : '—'}</div>
                <div className="text-xs text-gray-600 mb-1">{m.unit}</div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${!present || vitalData.connectionStatus === 'Lost' ? 'bg-gray-200 text-gray-700' : normal ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {vitalData.connectionStatus === 'Lost' && present ? 'Data terakhir' : status}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 p-2 bg-gray-50 rounded border text-xs grid grid-cols-3 gap-3 text-center">
          {metrics.map(m => <div key={m.label}><div className="text-gray-600">Batas indikator prototipe</div><div className="text-green-700">{m.range}</div></div>)}
        </div>
      </div>
    </div>
  );
}
import { AlertTriangle, AlertCircle, Clock, UserX } from 'lucide-react';
import type { VolunteerStatus } from '../../types/volunteer';
import type { Alert } from "../../types/alert";

interface AlertWarningSystemProps {
  alerts: Alert[];
  onDismissAlert?: (alertId: number) => void;
}

// Konfigurasi tampilan berdasarkan tingkat keparahan alert
const SEVERITY_STYLE: Record<VolunteerStatus, { card: string; badge: string; badgeText: string; label: string; icon: string }> = {
  Emergency : { card: 'bg-red-50 border-red-500', badge: 'bg-red-600 text-white', badgeText: '', label: 'EMERGENCY', icon: 'text-red-600' },
  Critical : { card: 'bg-red-50 border-red-300', badge: 'bg-red-500 text-white', badgeText: '', label: 'CRITICAL',  icon: 'text-red-500' },
  "High Risk": { card: 'bg-orange-50 border-orange-300', badge: 'bg-orange-500 text-white', badgeText: '', label: 'HIGH RISK', icon: 'text-orange-500' },
  Warning : { card: 'bg-yellow-50 border-yellow-300', badge: 'bg-yellow-400 text-yellow-900', badgeText: '', label: 'WARNING', icon: 'text-yellow-600' },
  Normal : { card: 'bg-green-50 border-green-300', badge: 'bg-green-500 text-white', badgeText: '', label: 'NORMAL', icon: 'text-green-500' },
};

// Menentukan ikon khusus berdasarkan jenis alert yang terjadi
function AlertTypeIcon({ type }: { type: Alert["type"] }) {
  switch (type) {
    case "Fall Detection":
      return <UserX className="w-4 h-4" />;

    case "Fatigue Detection":
      return <AlertCircle className="w-4 h-4" />;

    default:
      return <AlertCircle className="w-4 h-4" />;
  }
}

// Merangkum teks pesan alert, skor kelelahan, dan status tanda vital relawan
function AlertMessage({ alert }: { alert: Alert }) {
  const vitals: string[] = [];

  if (alert.heart_rate < 60)
    vitals.push(`HR ${alert.heart_rate} bpm ↓`);
  else if (alert.heart_rate > 100)
    vitals.push(`HR ${alert.heart_rate} bpm ↑`);
  else
    vitals.push(`HR ${alert.heart_rate} bpm`);

  if (alert.spo2 < 95)
    vitals.push(`SpO₂ ${alert.spo2}% ↓`);
  else
    vitals.push(`SpO₂ ${alert.spo2}%`);

  if (alert.temperature < 36.4)
    vitals.push(`Suhu ${alert.temperature}°C ↓`);
  else if (alert.temperature > 37.6)
    vitals.push(`Suhu ${alert.temperature}°C ↑`);
  else
    vitals.push(`Suhu ${alert.temperature}°C`);

  const scoreText = alert.fall_detected
    ? `Fall Detected · Fatigue ${alert.fatigue_score}/3`
    : `Fatigue ${alert.fatigue_score}/3`;

  return (
    <div className="text-sm leading-snug">
      <span className="font-semibold">{scoreText}</span>
      <span className="mx-1.5 text-gray-400">·</span>
      <span className="text-gray-700">{vitals.join(' · ')}</span>
    </div>
  );
}

// Komponen untuk merender daftar sistem alert yang aktif
export function AlertWarningSystem({ alerts, onDismissAlert }: AlertWarningSystemProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <h2 className="text-lg">Alert / Warning System</h2>
        </div>
        <div className="text-xs text-gray-600">
          {alerts.length} Alert{alerts.length !== 1 ? 's' : ''} Aktif
        </div>
      </div>
      <div className="p-3">
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Tidak ada alert aktif</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-auto">
            {alerts.map((alert) => {
              const style = SEVERITY_STYLE[alert.severity];
              return (
                <div key={alert.alert_id} className={`border-2 rounded-lg p-3 ${style.card}`}>
                  <div className="flex items-start gap-2">
                    <div className={`flex-shrink-0 mt-0.5 ${style.icon}`}>
                      <AlertTypeIcon type={alert.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${style.badge}`}>
                          {style.label}
                        </span>
                        <span className="text-xs text-gray-600 font-medium">{alert.volunteer_name}</span>
                      </div>
                      <AlertMessage alert={alert} />
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                        <Clock className="w-3 h-3" />
                        <span>{alert.timestamp}</span>
                      </div>
                    </div>
                    {onDismissAlert && (
                      <button
                        onClick={() => onDismissAlert(alert.alert_id)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-700 text-lg leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
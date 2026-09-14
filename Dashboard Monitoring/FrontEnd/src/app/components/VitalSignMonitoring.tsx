import { Heart, Droplet, Thermometer, Clock } from "lucide-react";
import type { VitalSignData } from "../../types/vital-sign";

interface VitalSignMonitoringProps {
  volunteerName: string;
  vitalData: VitalSignData;
}

// Komponen untuk memantau tanda vital relawan (detak jantung, SpO2, dan suhu tubuh)
export function VitalSignMonitoring({
  volunteerName,
  vitalData,
}: VitalSignMonitoringProps) {
  const heartRateNormal =
    vitalData.heartRate >= 60 && vitalData.heartRate <= 100;

  const spo2Normal = vitalData.spo2 >= 95;

  const temperatureNormal =
    vitalData.temperature >= 36.4 && vitalData.temperature <= 37.6;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-3 border-b">
        <h2 className="text-lg">
          Vital Sign Monitoring - {volunteerName}
        </h2>

        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
          <Clock className="w-3 h-3" />
          <span>Last Update: {vitalData.timestamp}</span>
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-3 gap-3">

          {/* Detak jantung */}
          <div
            className={`border-2 rounded-lg p-3 ${
              heartRateNormal
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-xs text-gray-600">Heart Rate</span>
            </div>

            <div className="text-2xl mb-1">
              {vitalData.heartRate}
            </div>

            <div className="text-xs text-gray-600 mb-1">
              bpm
            </div>

            <div
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                heartRateNormal
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {heartRateNormal ? "Normal" : "Abnormal"}
            </div>
          </div>

          {/* Saturasi oksigen (SpO2) */}
          <div
            className={`border-2 rounded-lg p-3 ${
              spo2Normal
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Droplet className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-gray-600">SpO₂</span>
            </div>

            <div className="text-2xl mb-1">
              {vitalData.spo2}
            </div>

            <div className="text-xs text-gray-600 mb-1">
              %
            </div>

            <div
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                spo2Normal
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {spo2Normal ? "Normal" : "Abnormal"}
            </div>
          </div>

          {/* Suhu tubuh */}
          <div
            className={`border-2 rounded-lg p-3 ${
              temperatureNormal
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Thermometer className="w-5 h-5 text-orange-500" />
              <span className="text-xs text-gray-600">
                Suhu Tubuh
              </span>
            </div>

            <div className="text-2xl mb-1">
              {vitalData.temperature}
            </div>

            <div className="text-xs text-gray-600 mb-1">
              °C
            </div>

            <div
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                temperatureNormal
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {temperatureNormal ? "Normal" : "Abnormal"}
            </div>
          </div>

        </div>

        <div className="mt-3 p-2 bg-gray-50 rounded border text-xs">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-gray-600">Normal Range</div>
              <div className="text-green-700">60-100 bpm</div>
            </div>

            <div>
              <div className="text-gray-600">Normal Range</div>
              <div className="text-green-700">95-100%</div>
            </div>

            <div>
              <div className="text-gray-600">Normal Range</div>
              <div className="text-green-700">36.4-37.6°C</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
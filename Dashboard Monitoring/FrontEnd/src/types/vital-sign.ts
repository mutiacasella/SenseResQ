export interface VitalSignData {
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  timestamp: string;
  connectionStatus: 'Connected' | 'Lost' | 'Awaiting Data';
}

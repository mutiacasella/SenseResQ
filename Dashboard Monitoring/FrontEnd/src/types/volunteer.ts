export type VolunteerStatus = 'Emergency' | 'Critical' | 'High Risk' | 'Warning' | 'Normal' | 'No Data';
export type ConnectionStatus = 'Connected' | 'Lost' | 'Awaiting Data';

export interface Volunteer {
  volunteer_id: string;
  name: string;
  device_id: string;
  assignment_id: number;
  heart_rate: number | null;
  spo2: number | null;
  temperature: number | null;
  fall_detected: boolean | number | null;
  activity_status: string | null;
  fatigue_score: number | null;
  status: VolunteerStatus;
  timestamp: string | null;
  connection_status: ConnectionStatus;
  last_received_age_ms?: number | null;
  x: number | null;
  y: number | null;
}
export type VolunteerStatus = 'Emergency' | 'Critical' | 'High Risk' | 'Warning' | 'Normal';

export interface Volunteer {
    volunteer_id: string;
    name: string;
    device_id: string;
    heart_rate: number;
    spo2: number;
    temperature: number;
    fall_detected: number;
    activity_status: string;
    fatigue_score: number;
    status: VolunteerStatus;
    timestamp: string;
    connection_status: string;
    x?: number; 
    y?: number;
}
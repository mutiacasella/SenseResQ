import type { VolunteerStatus } from "./volunteer";

export interface Alert {
    alert_id: number;
    volunteer_id: string;
    volunteer_name: string;
    type: "Fall Detection" | "Fatigue Detection";
    severity: VolunteerStatus;
    fatigue_score: number;
    fall_detected: boolean;
    heart_rate: number;
    spo2: number;
    temperature: number;
    timestamp: string;
}
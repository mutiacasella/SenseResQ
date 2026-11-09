// Skor 0-3 hanya boleh dihitung ketika ketiga sensor valid
const calculateFatigueScore = (heart_rate, temperature, spo2) => {
    if (![heart_rate, temperature, spo2].every(
        (value) => typeof value === 'number' && Number.isFinite(value)
    )) return null;

    let fatigue_score = 0;
    if (heart_rate < 60 || heart_rate > 175) fatigue_score++;
    if (temperature < 36.4 || temperature > 37.6) fatigue_score++;
    if (spo2 < 95) fatigue_score++;
    return fatigue_score;
};

const getSeverity = (fatigue_score, fall_detected) => {
    if (fall_detected === true || fall_detected === 1) return 'Emergency';
    if (fatigue_score === null || fatigue_score === undefined) return 'No Data';
    switch (fatigue_score) {
        case 3: return 'Critical';
        case 2: return 'High Risk';
        case 1: return 'Warning';
        default: return 'Normal';
    }
};

const getAlertType = (fall_detected, fatigue_score) => {
    if (fall_detected === true || fall_detected === 1) return 'Fall Detection';
    if (fatigue_score !== null && fatigue_score !== undefined && fatigue_score > 0) return 'Fatigue Detection';
    return null;
};

module.exports = { calculateFatigueScore, getSeverity, getAlertType };
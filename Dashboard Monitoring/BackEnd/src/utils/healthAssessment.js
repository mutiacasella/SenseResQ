// Menghitung skor kelelahan berdasarkan data vital
const calculateFatigueScore = (heart_rate, temperature, spo2) => {
    let fatigue_score = 0;

    // Heart Rate
    if (heart_rate < 60 || heart_rate > 100) {
        fatigue_score++;
    }

    // Temperature
    if (temperature < 36.4 || temperature > 37.6) {
        fatigue_score++;
    }

    // SpO₂
    if (spo2 < 95) {
        fatigue_score++;
    }

    return fatigue_score;
};

// Menentukan tingkat keparahan berdasarkan skor kelelahan dan deteksi jatuh
const getSeverity = (fatigue_score, fall_detected) => {
    if (fall_detected) {
        return "Emergency";
    }

    switch (fatigue_score) {
        case 3:
            return "Critical";

        case 2:
            return "High Risk";

        case 1:
            return "Warning";

        default:
            return "Normal";
    }
};

// Menentukan jenis peringatan berdasarkan deteksi jatuh dan skor kelelahan
const getAlertType = (fall_detected, fatigue_score) => {
    if (fall_detected) {
        return "Fall Detection";
    }

    if (fatigue_score > 0) {
        return "Fatigue Detection";
    }

    return null;
};

module.exports = {
    calculateFatigueScore,
    getSeverity,
    getAlertType,
};
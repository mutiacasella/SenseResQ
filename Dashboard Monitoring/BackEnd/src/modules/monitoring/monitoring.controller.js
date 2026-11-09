const monitoringRepository = require("./monitoring.repository");
const volunteerRepository = require("../volunteer/volunteer.repository");
const alertRepository = require("../alert/alert.repository");
const { calculateFatigueScore, getSeverity, getAlertType, } = require("../../utils/healthAssessment");
const { getIO } = require("../../utils/socket");

// Menambahkan data monitoring baru dan memproses logic peringatan
const createMonitoringData = async (req, res) => {
    try {
        const {
            device_id,
            heart_rate,
            spo2,
            temperature,
            fall_detected,
        } = req.body;

        const volunteer = await volunteerRepository.getVolunteerByDeviceId(device_id);
        if (!volunteer) {
            return res.status(409).json({ success: false, message: 'Perangkat belum memiliki penugasan aktif.' });
        }

        // Menghitung informasi peringatan
        const fatigue_score = calculateFatigueScore(heart_rate, temperature, spo2);
        const severity = getSeverity(fatigue_score, fall_detected);
        const type = getAlertType(fall_detected, fatigue_score);

        // Menyimpan data monitoring ke database
        const monitoringId = await monitoringRepository.createMonitoringData({ ...req.body, assignment_id: volunteer.assignment_id });

        const io = getIO();

        // Mengirimkan pembaruan data monitoring melalui socket real-time
        io.emit("monitoring:new", {
            monitoring_id: monitoringId,
            ...req.body,
            assignment_id: volunteer.assignment_id,
            fatigue_score,
            severity,
        });

        // Mengambil data peringatan terakhir dari relawan
        const latestAlert = await alertRepository.getLatestAlertByVolunteer(volunteer.volunteer_id, volunteer.assignment_id);
        
        // Membuat peringatan baru jika memenuhi kondisi tertentu
        if (type !== null) {
            const shouldCreateAlert = !latestAlert || latestAlert.type !== type || latestAlert.severity !== severity;

            if (shouldCreateAlert) {
                const alertData = {
                    volunteer_id: volunteer.volunteer_id,
                    assignment_id: volunteer.assignment_id,
                    type,
                    severity,
                    fatigue_score,
                    heart_rate,
                    spo2,
                    temperature,
                    fall_detected,
                    timestamp: new Date(),
                    test_id: req.body.test_id,
                };

                const alertId = await alertRepository.createAlert(alertData);

                // Mengirimkan notifikasi peringatan baru melalui socket real-time
                io.emit("alert:new", { alert_id: alertId, ...alertData });
            }
        }

        return res.status(201).json({
            success: true,
            message: "Monitoring data created successfully",
            monitoring_id: monitoringId,
        });
    } 
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Menerima data sensor dari simulator dan meneruskannya ke processIncomingData
const simulateMonitoringData = async (req, res) => {
    try {
        const { processIncomingData } = require("../../services/serialService");
        const result = await processIncomingData(req.body);
        if (!result?.accepted) {
            return res.status(400).json({ success: false, message: result?.reason || 'Paket ditolak.' });
        }
        return res.status(200).json({
            success: true,
            message: "Simulator data processed successfully",
        });
    }
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Mengambil data monitoring terbaru dari setiap perangkat
const getLatestMonitoringData = async (req, res) => {
    try {
        const monitoringData = await monitoringRepository.getLatestMonitoringData();

        return res.status(200).json({
            success: true,
            message: "Latest monitoring data retrieved successfully",
            data: monitoringData,
        });
    } 
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Mengambil riwayat data monitoring berdasarkan id perangkat
const getMonitoringHistory = async (req, res) => {
    try {
        const { device_id } = req.params;
        const monitoringHistory = await monitoringRepository.getMonitoringHistory(device_id);

        return res.status(200).json({
            success: true,
            message: "Monitoring history retrieved successfully",
            data: monitoringHistory,
        });
    } 
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createMonitoringData,
    simulateMonitoringData,
    getLatestMonitoringData,
    getMonitoringHistory,
};
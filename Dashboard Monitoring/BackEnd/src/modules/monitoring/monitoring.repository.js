const pool = require("../../config/database");

// Menambahkan data monitoring baru
const createMonitoringData = async (monitoringData) => {
    const {
        device_id,
        heart_rate,
        spo2,
        temperature,
        x,
        y,
        fall_detected,
        activity_status,
        timestamp,
    } = monitoringData;

    const [result] = await pool.query(
        `
        INSERT INTO MonitoringData
        (
            device_id,
            heart_rate,
            spo2,
            temperature,
            x,
            y,
            fall_detected,
            activity_status,
            timestamp
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            device_id,
            heart_rate,
            spo2,
            temperature,
            x,
            y,
            fall_detected,
            activity_status,
            timestamp,
        ]
    );

    return result.insertId;
};

// Mengambil data monitoring terakhir dari masing-masing perangkat
const getLatestMonitoringData = async () => {
    const [rows] = await pool.query(`
        SELECT m.*
        FROM MonitoringData m
        INNER JOIN (
            SELECT device_id, MAX(timestamp) AS latest_timestamp
            FROM MonitoringData
            GROUP BY device_id
        ) latest
        ON m.device_id = latest.device_id
        AND m.timestamp = latest.latest_timestamp
    `);

    return rows;
};

// Mengambil seluruh riwayat data monitoring berdasarkan id perangkat
const getMonitoringHistory = async (deviceId) => {
    const [rows] = await pool.query(
        "SELECT * FROM MonitoringData WHERE device_id = ? ORDER BY timestamp DESC",
        [deviceId]
    );

    return rows;
};

module.exports = {
    createMonitoringData,
    getLatestMonitoringData,
    getMonitoringHistory,
};
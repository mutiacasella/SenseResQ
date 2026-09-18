const pool = require("../../config/database");

// Menambahkan data peringatan baru
const createAlert = async (alertData) => {
    const {
        volunteer_id,
        type,
        severity,
        fatigue_score,
        heart_rate,
        spo2,
        temperature,
        fall_detected,
        timestamp,
    } = alertData;

    const [result] = await pool.query(
        `
        INSERT INTO Alert
        (
            volunteer_id,
            type,
            severity,
            fatigue_score,
            heart_rate,
            spo2,
            temperature,
            fall_detected,
            timestamp
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            volunteer_id,
            type,
            severity,
            fatigue_score,
            heart_rate,
            spo2,
            temperature,
            fall_detected,
            timestamp,
        ]
    );

    return result.insertId;
};

// Mengambil seluruh data peringatan
const getAllAlerts = async () => {
    const [rows] = await pool.query(`
        SELECT
            a.alert_id,
            a.volunteer_id,
            v.name AS volunteer_name,
            a.type,
            a.severity,
            a.fatigue_score,
            a.heart_rate,
            a.spo2,
            a.temperature,
            a.fall_detected,
            a.timestamp
        FROM Alert a
        JOIN Volunteer v
            ON a.volunteer_id = v.volunteer_id
        ORDER BY a.timestamp DESC
    `);

    return rows;
};

// Mengambil satu data peringatan berdasarkan id peringatan
const getAlertById = async (alertId) => {
    const [rows] = await pool.query(
        "SELECT * FROM Alert WHERE alert_id = ?",
        [alertId]
    );

    return rows[0];
};

// Mengambil data peringatan terakhir berdasarkan id relawan
const getLatestAlertByVolunteer = async (volunteerId) => {
    const [rows] = await pool.query(
        "SELECT * FROM Alert WHERE volunteer_id = ? ORDER BY timestamp DESC LIMIT 1",
        [volunteerId]
    );

    return rows[0];
};

module.exports = {
    createAlert,
    getAllAlerts,
    getAlertById,
    getLatestAlertByVolunteer,
};
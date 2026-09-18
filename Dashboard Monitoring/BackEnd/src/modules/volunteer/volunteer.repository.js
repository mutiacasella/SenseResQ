const pool = require("../../config/database");

// Menambahkan data relawan baru ke database
const createVolunteer = async (volunteer) => {
    const { volunteer_id, name, device_id } = volunteer;

    const [result] = await pool.query(
        "INSERT INTO Volunteer (volunteer_id, name, device_id) VALUES (?, ?, ?)",
        [volunteer_id, name, device_id]
    );

    return result;
};

// Mengambil seluruh data relawan
const getAllVolunteers = async () => {
    const [rows] = await pool.query(
        "SELECT * FROM Volunteer"
    );

    return rows;
};

// Mengambil satu data relawan berdasarkan id relawan
const getVolunteerById = async (volunteerId) => {
    const [rows] = await pool.query(
        "SELECT * FROM Volunteer WHERE volunteer_id = ?",
        [volunteerId]
    );

    return rows[0];
};

// Mengambil satu data relawan berdasarkan id perangkat
const getVolunteerByDeviceId = async (deviceId) => {
    const [rows] = await pool.query(
        "SELECT * FROM Volunteer WHERE device_id = ?",
        [deviceId]
    );

    return rows[0];
};

// Mengambil data relawan yang ditampilkan di dashboard
const getDashboardVolunteers = async () => {
    const [rows] = await pool.query(`
        SELECT
            v.volunteer_id,
            v.name,
            v.device_id,
            m.heart_rate,
            m.spo2,
            m.temperature,
            m.x,
            m.y,
            m.fall_detected,
            m.activity_status,
            m.timestamp
        FROM Volunteer v
        LEFT JOIN MonitoringData m
        ON m.monitoring_id = (
            SELECT monitoring_id
            FROM MonitoringData
            WHERE device_id = v.device_id
            ORDER BY timestamp DESC, monitoring_id DESC
            LIMIT 1
        )
    `);

    return rows;
};

// Memperbarui satu data relawan berdasarkan id
const updateVolunteer = async (volunteerId, volunteer) => {
    const { name, device_id } = volunteer;

    const [result] = await pool.query(
        `
        UPDATE Volunteer
        SET name = ?, device_id = ?
        WHERE volunteer_id = ?
        `,
        [name, device_id, volunteerId]
    );

    return result;
};

// Menghapus satu data relawan berdasarkan id
const deleteVolunteer = async (volunteerId) => {
    const [result] = await pool.query(
        "DELETE FROM Volunteer WHERE volunteer_id = ?",
        [volunteerId]
    );

    return result;
};

module.exports = {
    getAllVolunteers,
    getVolunteerById,
    getVolunteerByDeviceId,
    getDashboardVolunteers,
    createVolunteer,
    updateVolunteer,
    deleteVolunteer,
};
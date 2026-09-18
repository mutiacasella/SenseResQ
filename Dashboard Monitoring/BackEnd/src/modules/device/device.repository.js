const pool = require("../../config/database");

// Menyimpan data device baru
const createDevice = async (deviceId) => {
    const [result] = await pool.query(
        "INSERT INTO Device (device_id) VALUES (?)",
        [deviceId]
    );

    return result;
};

// Mengambil seluruh data perangkat
const getAllDevices = async () => {
    const [rows] = await pool.query(
        "SELECT * FROM Device"
    );

    return rows;
};

// Mengambil satu data perangkat berdasarkan id
const getDeviceById = async (deviceId) => {
    const [rows] = await pool.query(
        "SELECT * FROM Device WHERE device_id = ?",
        [deviceId]
    );

    return rows[0];
};

// Menghapus satu data perangkat berdasarkan id
const deleteDevice = async (deviceId) => {
    const [result] = await pool.query(
        "DELETE FROM Device WHERE device_id = ?",
        [deviceId]
    );

    return result;
};

module.exports = {
    getAllDevices,
    getDeviceById,
    createDevice,
    deleteDevice,
};
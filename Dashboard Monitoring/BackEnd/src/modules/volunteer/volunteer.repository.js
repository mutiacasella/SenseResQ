const pool = require('../../config/database');

// Relawan dan perangkat merupakan identitas permanen
// Hubungan saat bertugas disimpan pada DeviceAssignment agar setiap periode monitoring terpisah
const getAllVolunteers = async () => {
  const [rows] = await pool.query(`SELECT v.*, a.device_id AS active_device_id,
    a.assignment_id FROM Volunteer v
    JOIN DeviceAssignment a ON a.volunteer_id = v.volunteer_id AND a.ended_at IS NULL
    WHERE v.is_active = 1 ORDER BY v.name`);
  return rows;
};

const getInactiveVolunteers = async () => {
  const [rows] = await pool.query(`SELECT volunteer_id, name, device_id FROM Volunteer
    WHERE is_active = 0 ORDER BY name, volunteer_id`);
  return rows;
};

const getVolunteerById = async (volunteerId) => {
  const [rows] = await pool.query('SELECT * FROM Volunteer WHERE volunteer_id = ?', [volunteerId]);
  return rows[0];
};

// Pemanggil monitoring hanya boleh mengaitkan paket ke penugasan yang masih aktif
const getVolunteerByDeviceId = async (deviceId) => {
  const [rows] = await pool.query(`
    SELECT v.*, a.assignment_id, a.device_id AS active_device_id
    FROM DeviceAssignment a JOIN Volunteer v ON v.volunteer_id = a.volunteer_id
    WHERE a.device_id = ? AND a.ended_at IS NULL AND v.is_active = 1 LIMIT 1`, [deviceId]);
  return rows[0];
};

const getDashboardVolunteers = async () => {
  const [rows] = await pool.query(`
    SELECT v.volunteer_id, v.name, a.device_id, a.assignment_id,
      m.heart_rate, m.spo2, m.temperature, m.x, m.y,
      m.fall_detected, m.activity_status, m.timestamp
    FROM Volunteer v
    JOIN DeviceAssignment a ON a.volunteer_id = v.volunteer_id AND a.ended_at IS NULL
    LEFT JOIN MonitoringData m ON m.monitoring_id = (
      SELECT m2.monitoring_id FROM MonitoringData m2
      WHERE m2.assignment_id = a.assignment_id
      ORDER BY m2.timestamp DESC, m2.monitoring_id DESC LIMIT 1
    )
    WHERE v.is_active = 1
  `);
  return rows;
};

const withTransaction = async (task) => {
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const result = await task(db);
    await db.commit();
    return result;
  } catch (error) {
    await db.rollback();
    throw error;
  } finally { db.release(); }
};

const httpError = (status, message) => Object.assign(new Error(message), { status });

async function lockDevice(db, deviceId) {
  const [devices] = await db.query('SELECT device_id FROM Device WHERE device_id = ? FOR UPDATE', [deviceId]);
  if (!devices.length) throw httpError(400, 'Perangkat belum terdaftar.');
  const [assigned] = await db.query(
    'SELECT assignment_id FROM DeviceAssignment WHERE device_id = ? AND ended_at IS NULL', [deviceId]
  );
  if (assigned.length) throw httpError(409, 'Perangkat sedang digunakan oleh relawan lain.');
}

const createVolunteer = (volunteer) => withTransaction(async (db) => {
  const { volunteer_id, name, device_id } = volunteer;
  await lockDevice(db, device_id);
  await db.query('INSERT INTO Volunteer (volunteer_id, name, device_id, is_active) VALUES (?, ?, ?, 1)',
    [volunteer_id, name, device_id]);
  await db.query('INSERT INTO DeviceAssignment (volunteer_id, device_id) VALUES (?, ?)', [volunteer_id, device_id]);
});

const activateVolunteer = (volunteerId, deviceId) => withTransaction(async (db) => {
  const [rows] = await db.query('SELECT * FROM Volunteer WHERE volunteer_id = ? FOR UPDATE', [volunteerId]);
  if (!rows.length) throw httpError(404, 'Relawan tidak ditemukan.');
  if (rows[0].is_active) throw httpError(409, 'Relawan masih memiliki penugasan aktif.');
  await lockDevice(db, deviceId);
  await db.query('UPDATE Volunteer SET is_active = 1, device_id = ? WHERE volunteer_id = ?', [deviceId, volunteerId]);
  await db.query('INSERT INTO DeviceAssignment (volunteer_id, device_id) VALUES (?, ?)', [volunteerId, deviceId]);
});

const updateVolunteer = (volunteerId, { name, device_id }) => withTransaction(async (db) => {
  const [rows] = await db.query('SELECT * FROM Volunteer WHERE volunteer_id = ? FOR UPDATE', [volunteerId]);
  if (!rows.length || !rows[0].is_active) throw httpError(404, 'Relawan tidak ada dalam daftar aktif.');
  const [assignments] = await db.query(`SELECT assignment_id, device_id FROM DeviceAssignment
    WHERE volunteer_id = ? AND ended_at IS NULL FOR UPDATE`, [volunteerId]);
  if (assignments.length !== 1) throw httpError(409, 'Penugasan relawan tidak konsisten.');
  const active = assignments[0];
  if (active.device_id !== device_id) {
    await lockDevice(db, device_id);
    await db.query('UPDATE DeviceAssignment SET ended_at = NOW(3) WHERE assignment_id = ?', [active.assignment_id]);
    await db.query('INSERT INTO DeviceAssignment (volunteer_id, device_id) VALUES (?, ?)', [volunteerId, device_id]);
  }
  await db.query('UPDATE Volunteer SET name = ?, device_id = ? WHERE volunteer_id = ?', [name, device_id, volunteerId]);
});

// Mengakhiri penugasan; identitas relawan dan seluruh riwayat tetap ada
const deleteVolunteer = (volunteerId) => withTransaction(async (db) => {
  const [rows] = await db.query('SELECT * FROM Volunteer WHERE volunteer_id = ? FOR UPDATE', [volunteerId]);
  if (!rows.length || !rows[0].is_active) throw httpError(404, 'Relawan tidak ada dalam daftar aktif.');
  await db.query('UPDATE DeviceAssignment SET ended_at = NOW(3) WHERE volunteer_id = ? AND ended_at IS NULL', [volunteerId]);
  await db.query('UPDATE Volunteer SET is_active = 0 WHERE volunteer_id = ?', [volunteerId]);
});

module.exports = {
  createVolunteer, getAllVolunteers, getInactiveVolunteers, getVolunteerById,
  getVolunteerByDeviceId, getDashboardVolunteers, updateVolunteer, deleteVolunteer, activateVolunteer,
};

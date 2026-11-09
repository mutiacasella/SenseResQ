// Persiapan dan migrasi database MySQL lokal tanpa menghapus catatan sebelumnya
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const quoteIdentifier = (name) => `\`${name.replace(/`/g, '``')}\``;

async function columnExists(db, table, column) {
  const [rows] = await db.query(`SHOW COLUMNS FROM ${quoteIdentifier(table)} LIKE ?`, [column]);
  return rows.length > 0;
}

async function foreignKeyExists(db, table, name) {
  const [rows] = await db.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(?)
       AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [table, name]
  );
  return rows.length > 0;
}

async function indexExists(db, table, index) {
  const [rows] = await db.query(`SHOW INDEX FROM ${quoteIdentifier(table)} WHERE Key_name = ?`, [index]);
  return rows.length > 0;
}

async function main() {
  for (const key of ['DB_HOST', 'DB_USER', 'DB_NAME']) {
    if (!process.env[key]) throw new Error(`${key} belum diisi pada BackEnd/.env.`);
  }
  if (process.env.DB_NAME !== 'senseresq') throw new Error('DB_NAME harus senseresq.');
  if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === 'GANTI_DENGAN_PASSWORD_MYSQL') {
    throw new Error('Isi DB_PASSWORD pada BackEnd/.env.');
  }

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true,
  });
  try {
    const schema = fs.readFileSync(path.join(__dirname, '..', 'src', 'schema.sql'), 'utf8');
    await db.query(schema);
    await db.query('USE senseresq');

    if (!(await columnExists(db, 'Volunteer', 'is_active'))) {
      await db.query('ALTER TABLE Volunteer ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1');
    }

    if (!(await indexExists(db, 'Volunteer', 'idx_volunteer_device_lookup'))) {
      await db.query('ALTER TABLE Volunteer ADD INDEX idx_volunteer_device_lookup (device_id)');
    }
    const [indexes] = await db.query('SHOW INDEX FROM Volunteer');
    const groups = new Map();
    for (const row of indexes) {
      if (!groups.has(row.Key_name)) groups.set(row.Key_name, []);
      groups.get(row.Key_name).push(row);
    }
    for (const [name, parts] of groups) {
      if (name === 'PRIMARY' || parts.length !== 1) continue;
      if (Number(parts[0].Non_unique) === 0 && String(parts[0].Column_name).toLowerCase() === 'device_id') {
        await db.query(`ALTER TABLE Volunteer DROP INDEX ${quoteIdentifier(name)}`);
      }
    }

    for (const table of ['MonitoringData', 'Alert']) {
      if (!(await columnExists(db, table, 'assignment_id'))) {
        await db.query(`ALTER TABLE ${table} ADD COLUMN assignment_id BIGINT UNSIGNED NULL`);
      }
      const idx = `idx_${table.toLowerCase()}_assignment`;
      if (!(await indexExists(db, table, idx))) {
        await db.query(`ALTER TABLE ${table} ADD INDEX ${idx} (assignment_id)`);
      }
      const fk = `fk_${table.toLowerCase()}_assignment`;
      if (!(await foreignKeyExists(db, table, fk))) {
        await db.query(`ALTER TABLE ${table} ADD CONSTRAINT ${fk} FOREIGN KEY (assignment_id) REFERENCES DeviceAssignment(assignment_id)`);
      }
    }

    await db.beginTransaction();
    try {
      const [legacy] = await db.query(`
        SELECT v.volunteer_id, v.device_id, v.is_active
        FROM Volunteer v
        WHERE NOT EXISTS (SELECT 1 FROM DeviceAssignment d WHERE d.volunteer_id = v.volunteer_id)
        FOR UPDATE
      `);
      for (const vol of legacy) {
        const [[history]] = await db.query(
          'SELECT MIN(timestamp) AS earliest FROM MonitoringData WHERE device_id = ?', [vol.device_id]
        );
        const started = history.earliest || new Date();
        const [inserted] = await db.query(
          `INSERT INTO DeviceAssignment (volunteer_id, device_id, started_at, ended_at)
           VALUES (?, ?, ?, ${vol.is_active ? 'NULL' : 'NOW(3)'})`,
          [vol.volunteer_id, vol.device_id, started]
        );
        await db.query('UPDATE MonitoringData SET assignment_id = ? WHERE device_id = ? AND assignment_id IS NULL',
          [inserted.insertId, vol.device_id]);
        await db.query('UPDATE Alert SET assignment_id = ? WHERE volunteer_id = ? AND assignment_id IS NULL',
          [inserted.insertId, vol.volunteer_id]);
      }
      await db.commit();
      console.log(`[DB] Migrasi berhasil. ${legacy.length} penugasan historis disiapkan.`);
    } catch (error) {
      await db.rollback();
      throw error;
    }

    const [tables] = await db.query('SHOW TABLES FROM senseresq');
    const present = new Set(tables.map((row) => String(Object.values(row)[0]).toLowerCase()));
    if (!['device','volunteer','monitoringdata','alert','deviceassignment'].every((name) => present.has(name))) {
      throw new Error('Struktur database belum lengkap.');
    }
    console.log('[DB] Siap: 5 tabel tersedia. Data lama dipertahankan.');
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error('[DB] GAGAL:', error.message);
  console.error('Periksa layanan MySQL, konfigurasi .env, dan struktur database. Jangan menghapus data.');
  process.exitCode = 1;
});

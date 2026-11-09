-- Struktur SenseResQ
CREATE DATABASE IF NOT EXISTS senseresq;
USE senseresq;

CREATE TABLE IF NOT EXISTS Device (
    device_id VARCHAR(10) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS Volunteer (
    volunteer_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    device_id VARCHAR(10) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (device_id) REFERENCES Device(device_id)
);

CREATE TABLE IF NOT EXISTS MonitoringData (
    monitoring_id INTEGER AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(10) NOT NULL,
    heart_rate INTEGER NOT NULL,
    spo2 INTEGER NOT NULL,
    temperature FLOAT NOT NULL,
    x FLOAT NOT NULL,
    y FLOAT NOT NULL,
    fall_detected BOOLEAN NOT NULL,
    activity_status ENUM('Active', 'Idle', 'Fall Detected') NOT NULL,
    timestamp DATETIME NOT NULL,
    FOREIGN KEY (device_id) REFERENCES Device(device_id)
);

CREATE TABLE IF NOT EXISTS Alert (
    alert_id INTEGER AUTO_INCREMENT PRIMARY KEY,
    volunteer_id VARCHAR(10) NOT NULL,
    type ENUM('Fall Detection', 'Fatigue Detection') NOT NULL,
    severity ENUM('Emergency', 'Critical', 'High Risk', 'Warning', 'Normal') NOT NULL,
    fatigue_score INTEGER NOT NULL,
    heart_rate INTEGER NOT NULL,
    spo2 INTEGER NOT NULL,
    temperature FLOAT NOT NULL,
    fall_detected BOOLEAN NOT NULL,
    timestamp DATETIME NOT NULL,
    FOREIGN KEY (volunteer_id) REFERENCES Volunteer(volunteer_id)
);

-- Satu perangkat dan satu relawan hanya boleh punya satu penugasan aktif
-- UNIQUE pada kolom generated mengizinkan banyak penugasan yang telah berakhir
CREATE TABLE IF NOT EXISTS DeviceAssignment (
    assignment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    volunteer_id VARCHAR(10) NOT NULL,
    device_id VARCHAR(10) NOT NULL,
    started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ended_at DATETIME(3) NULL,
    active_volunteer_id VARCHAR(10) GENERATED ALWAYS AS (
        CASE WHEN ended_at IS NULL THEN volunteer_id ELSE NULL END
    ) STORED,
    active_device_id VARCHAR(10) GENERATED ALWAYS AS (
        CASE WHEN ended_at IS NULL THEN device_id ELSE NULL END
    ) STORED,
    UNIQUE KEY uq_assignment_active_volunteer (active_volunteer_id),
    UNIQUE KEY uq_assignment_active_device (active_device_id),
    KEY idx_assignment_volunteer (volunteer_id),
    KEY idx_assignment_device (device_id),
    FOREIGN KEY (volunteer_id) REFERENCES Volunteer(volunteer_id),
    FOREIGN KEY (device_id) REFERENCES Device(device_id)
);

-- Kolom assignment_id pada MonitoringData dan Alert ditambahkan secara aman oleh tools/setupDatabase.js agar database lama tetap dapat digunakan
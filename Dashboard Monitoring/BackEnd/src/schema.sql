DROP DATABASE IF EXISTS senseresq;
CREATE DATABASE senseresq;
USE senseresq;

CREATE TABLE Device (
    device_id VARCHAR(10) PRIMARY KEY
);

CREATE TABLE Volunteer (
    volunteer_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    device_id VARCHAR(10) NOT NULL,

    FOREIGN KEY (device_id) REFERENCES Device(device_id)
);

CREATE TABLE MonitoringData (
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

CREATE TABLE Alert (
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

-- Langsung hapus semua + reset auto increment ke 1 (buat testing)
TRUNCATE TABLE Device;
TRUNCATE TABLE Volunteer;
TRUNCATE TABLE MonitoringData;
TRUNCATE TABLE Alert;
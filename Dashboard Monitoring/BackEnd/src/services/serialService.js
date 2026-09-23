const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
require('dotenv').config();

const monitoringRepository = require('../modules/monitoring/monitoring.repository');
const alertRepository = require('../modules/alert/alert.repository');
const volunteerRepository = require('../modules/volunteer/volunteer.repository');

const { calculateFatigueScore, getSeverity, getAlertType } = require('../utils/healthAssessment');
const { getIO } = require('../utils/socket');

// Konfigurasi serial, di-set di file [.env]
const portPath = process.env.SERIAL_PORT || 'COM3';
const baudRate = parseInt(process.env.SERIAL_BAUD, 10) || 115200;

// Batas koordinat bounding box area bencana, di-set di file [.env]
const BBOX = {
    MIN_LAT: parseFloat(process.env.BBOX_MIN_LAT) || -6.3780,
    MAX_LAT: parseFloat(process.env.BBOX_MAX_LAT) || -6.3350,
    MIN_LNG: parseFloat(process.env.BBOX_MIN_LNG) || 106.8150,
    MAX_LNG: parseFloat(process.env.BBOX_MAX_LNG) || 106.8400,
};

// Konversi koordinat GPS (latitude, longitude) menjadi koordinat piksel relatif (x,y)
const convertToXY = (latitude, longitude) => {
    const x = ((longitude - BBOX.MIN_LNG) / (BBOX.MAX_LNG - BBOX.MIN_LNG)) * 100;
    const y = ((BBOX.MAX_LAT - latitude) / (BBOX.MAX_LAT - BBOX.MIN_LAT)) * 100;

    return { 
        x: Math.max(0, Math.min(100, x)), 
        y: Math.max(0, Math.min(100, y)) 
    };
};

// Memproses data mentah dari receiver menjadi record monitoring & alert
// Fungsi ini dipakai baik oleh serial port maupun simulator (mock)
const processIncomingData = async (rawData) => {
    try {
        console.log("Received data:", rawData);

        // Ambil latitude dan longitude mentah dari GPS, dan kumpulan data lainnya
        const { device_id, heart_rate, spo2, temperature, latitude, longitude, fall_detected, activity_status } = rawData;
        const timestamp = new Date();

        // Validasi device_id ada di tabel Device
        const deviceExists = await monitoringRepository.deviceExists(device_id);
        if (!deviceExists) {
            console.warn(`[Serial] Unknown device_id "${device_id}", skipping.`);
            return;
        }

        // Konversi latitude dan longitude menjadi koordinat relatif x dan y
        const { x, y } = convertToXY(latitude, longitude);

        const monitoringDataToSave = {
            device_id,
            heart_rate,
            spo2,
            temperature,
            x,
            y,
            fall_detected,
            activity_status,
            timestamp
        };

        // Evaluasi status kesehatan, skor kelelahan, dan tingkat keparahan
        const fatigue_score = calculateFatigueScore(heart_rate, temperature, spo2);
        const severity = getSeverity(fatigue_score, fall_detected);
        const type = getAlertType(fall_detected, fatigue_score);

        // Simpan data monitoring yang masuk ke dalam database
        const monitoringId = await monitoringRepository.createMonitoringData(monitoringDataToSave);

        // Kirim data monitoring baru secara real-time melalui WebSocket
        const io = getIO();
        io.emit("monitoring:new", {
            monitoring_id: monitoringId,
            ...monitoringDataToSave,
            fatigue_score,
            severity,
        });

        // Cek relawan terkait dan buat peringatan jika threshold terlewati
        const volunteer = await volunteerRepository.getVolunteerByDeviceId(device_id);
        if (volunteer && type !== null) {
            const latestAlert = await alertRepository.getLatestAlertByVolunteer(volunteer.volunteer_id);
            const shouldCreateAlert = !latestAlert || latestAlert.type !== type || latestAlert.severity !== severity;

            if (shouldCreateAlert) {
                const alertData = {
                    volunteer_id: volunteer.volunteer_id,
                    type,
                    severity,
                    fatigue_score,
                    heart_rate,
                    spo2,
                    temperature,
                    fall_detected,
                    timestamp,
                };

                await alertRepository.createAlert(alertData);
                io.emit("alert:new", alertData);
            }
        }
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            console.error("[Serial] JSON parse error. Raw line:", rawData);
        } 
        else {
            console.error("[Serial] Failed to process data:", error.message);
        }
    }
};

const initSerial = () => {
    // Mode mock: skip koneksi serial fisik, dipakai untuk testing via simulator
    if (process.env.MOCK_MODE === 'true') {
        console.log('[Serial] MOCK_MODE aktif, koneksi serial fisik diabaikan');
        return;
    }

    const port = new SerialPort({ path: portPath, baudRate: baudRate });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    port.on('open', () => {
        console.log(`Serial Port ${portPath} connected successfully.`);
    });

    parser.on('data', async (line) => {
        try {
            // Ubah string teks mentah dari port serial menjadi format JSON
            const rawData = JSON.parse(line);
            await processIncomingData(rawData);
        }
        catch (error) {
            console.error("[Serial] JSON parse error. Raw line:", line);
        }
    });

    port.on('error', (err) => {
        console.error("Serial port error: ", err.message);
    });
};

module.exports = { initSerial, processIncomingData };
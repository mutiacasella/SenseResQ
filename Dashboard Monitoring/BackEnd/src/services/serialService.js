const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
require('dotenv').config();

const monitoringRepository = require('../modules/monitoring/monitoring.repository');
const alertRepository = require('../modules/alert/alert.repository');
const volunteerRepository = require('../modules/volunteer/volunteer.repository');

const { calculateFatigueScore, getSeverity, getAlertType } = require('../utils/healthAssessment');
const { getIO } = require('../utils/socket');
const { setSerialStatus } = require('../utils/serialStatus');

// Konfigurasi serial, di-set di file [.env]
const portPath = process.env.SERIAL_PORT || 'COM3';
const baudRate = parseInt(process.env.SERIAL_BAUD, 10) || 115200;

// Batas koordinat bounding box area bencana, di-set di file [.env]
const BBOX = {
    MIN_LAT: parseFloat(process.env.BBOX_MIN_LAT) || -6.3850,
    MAX_LAT: parseFloat(process.env.BBOX_MAX_LAT) || -6.3450,
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
        const { 
            device_id, 
            heart_rate, 
            spo2, 
            temperature, 
            latitude, 
            longitude, 
            fall_detected, 
            activity_status,
            test_id, // metadata pengujian
            sent_at  // metadata pengujian
        } = rawData;

        const timestamp = new Date();

        // Validasi device_id ada di tabel Device
        const deviceExists = await monitoringRepository.deviceExists(device_id);
        if (!deviceExists) {
            console.warn(`[Serial] Unknown device_id "${device_id}", skipping.`);
            return { accepted: false, reason: 'unknown_device' };
        }

        // Paket hanya disimpan ketika perangkat sedang memiliki penugasan aktif.
        // Ini mencegah data lama masuk ke identitas relawan berikutnya.
        const assignedVolunteer = await volunteerRepository.getVolunteerByDeviceId(device_id);
        if (!assignedVolunteer) {
            console.warn(`[Serial] Device ${device_id} tidak memiliki penugasan aktif; paket dilewati.`);
            return { accepted: false, reason: 'no_active_assignment' };
        }

        // Konversi latitude dan longitude menjadi koordinat relatif x dan y
        const { x, y } = convertToXY(latitude, longitude);

        const monitoringDataToSave = {
            device_id,
            assignment_id: assignedVolunteer.assignment_id,
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

        // Kirim data monitoring baru secara real-time melalui Socket IO
        const io = getIO();

        io.emit("monitoring:new", {
            monitoring_id: monitoringId,
            ...monitoringDataToSave,
            fatigue_score,
            severity,

            // Metadata pengujian
            test_id: rawData.test_id,
        });

        // Cek relawan terkait dan buat peringatan jika threshold terlewati
        const volunteer = assignedVolunteer;
        if (volunteer && type !== null) {
            const latestAlert = await alertRepository.getLatestAlertByVolunteer(volunteer.volunteer_id, volunteer.assignment_id);
            const shouldCreateAlert = !latestAlert || latestAlert.type !== type || latestAlert.severity !== severity;

            if (shouldCreateAlert) {
                const alertData = {
                    volunteer_id: volunteer.volunteer_id,
                    assignment_id: volunteer.assignment_id,
                    volunteer_name: volunteer.name,
                    type,
                    severity,
                    fatigue_score,
                    heart_rate,
                    spo2,
                    temperature,
                    fall_detected,
                    timestamp,

                    // Metadata pengujian
                    test_id: rawData.test_id,
                };

                const alertId = await alertRepository.createAlert(alertData);
                io.emit("alert:new", { alert_id: alertId, ...alertData });
            }
        }
        return { accepted: true };
    }
    catch (error) {
        console.error('[Serial] Failed to process data:', error.message);
        throw error;
    }
};

const initSerial = () => {
    // Mode mock: skip koneksi serial fisik, dipakai untuk testing via simulator
    if (process.env.MOCK_MODE === 'true') {
        setSerialStatus('mock');
        console.log('[Serial] MOCK_MODE aktif, koneksi serial fisik diabaikan');
        return;
    }

    const port = new SerialPort({
        path: portPath,
        baudRate: baudRate,
        autoOpen: false,
        rtscts: false
    });

    port.open((err) => {
        if (err) {
            setSerialStatus('disconnected');
            console.error('[Serial] Failed to open port:', err.message);
            return;
        }

        port.set({ dtr: false, rts: false }, (err) => {
            if (err) {
                console.error('[Serial] Failed to configure control signals:', err.message);
            }
        });
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    port.on('open', () => {
        setSerialStatus('connected');
        console.log(`Serial Port ${portPath} connected successfully.`);
    });

    parser.on('data', async (line) => {
        try {
            // Ubah string teks mentah dari port serial menjadi javascript object
            const rawData = JSON.parse(line);
            await processIncomingData(rawData);
        }
        catch (error) {
            console.error('[Serial] Failed to process line:', error.message);
        }
    });

    port.on('close', () => setSerialStatus('disconnected'));

    port.on('error', (err) => {
        setSerialStatus('disconnected');
        console.error("Serial port error: ", err.message);
    });
};

module.exports = { initSerial, processIncomingData };
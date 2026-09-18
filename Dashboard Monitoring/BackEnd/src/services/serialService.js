const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const monitoringRepository = require('../modules/monitoring/monitoring.repository');
const alertRepository = require('../modules/alert/alert.repository');
const volunteerRepository = require('../modules/volunteer/volunteer.repository');

const { calculateFatigueScore, getSeverity, getAlertType } = require('../utils/healthAssessment');
const { getIO } = require('../utils/socket');

// Konversi koordinat GPS (latitude, longitude) menjadi koordinat piksel relatif (x,y)
const convertToXY = (latitude, longitude) => {
    // Batas koordinat bounding box area bencana (selalu sesuaikan dengan area bencana)
    const MIN_LAT = -6.3780; 
    const MAX_LAT = -6.3350;
    const MIN_LNG = 106.8150;
    const MAX_LNG = 106.8400;

    // Hasil dihitung dalam bentuk persen agar sesuai dengan style CSS frontend (left/top %)
    const x = ((longitude - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 100;
    const y = ((MAX_LAT - latitude) / (MAX_LAT - MIN_LAT)) * 100;

    // Batasi nilai
    return { 
        x: Math.max(0, Math.min(100, x)), 
        y: Math.max(0, Math.min(100, y)) 
    };
};

// Note: sesuain sama port laptop entar
const portPath = 'COM3';
const baudRate = 115200;

const initSerial = () => {
    const port = new SerialPort({ path: portPath, baudRate: baudRate });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    port.on('open', () => {
        console.log(`Serial Port ${portPath} connected successfully.`);
    });

    parser.on('data', async (line) => {
        try {
            // Ubah string teks mentah dari port serial menjadi format JSON
            const rawData = JSON.parse(line);
            console.log("Received data:", rawData);

            // Ambil latitude dan longitude mentah dari GPS, dan kumpulan data lainnya
            const { device_id, heart_rate, spo2, temperature, latitude, longitude, fall_detected, activity_status } = rawData;
            const timestamp = new Date();

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
            console.error("Failed to parse serial data or save to database:", error.message);
        }
    });

    port.on('error', (err) => {
        console.error("Serial port error: ", err.message);
    });
};

module.exports = { initSerial };
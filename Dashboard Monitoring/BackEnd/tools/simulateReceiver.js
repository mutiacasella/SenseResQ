/**
 * Simulator Data Receiver
 *
 * Modul ini mensimulasikan pengiriman data dari receiver
 * (ESP32 + LoRa RX) ke backend melalui HTTP
 *
 * Data simulasi dikirim ke endpoint:
 *   POST http://localhost:7777/monitoring/simulator
 *
 * Cara penggunaan:
 *   node tools/simulateReceiver.js
 *   node tools/simulateReceiver.js normal
 *   node tools/simulateReceiver.js warning
 *   node tools/simulateReceiver.js highrisk
 *   node tools/simulateReceiver.js critical
 *   node tools/simulateReceiver.js fall
 *   node tools/simulateReceiver.js unknown
 *   node tools/simulateReceiver.js progression
 *
 * Prasyarat:
 *   1. Backend sudah berjalan pada terminal terpisah
 *   2. Backend berjalan pada PORT yang sesuai dengan .env
 *
 * Catatan:
 *   Simulator mengirim data melalui HTTP agar benar-benar menguji
 *   alur backend seperti receiver sungguhan
 */

require('dotenv').config();

// URL backend
const BACKEND_URL = `http://localhost:${process.env.PORT || 7777}`;

// Batas koordinat bounding box area bencana
const BBOX = {
    MIN_LAT: parseFloat(process.env.BBOX_MIN_LAT) || -6.3780,
    MAX_LAT: parseFloat(process.env.BBOX_MAX_LAT) || -6.3350,
    MIN_LNG: parseFloat(process.env.BBOX_MIN_LNG) || 106.8150,
    MAX_LNG: parseFloat(process.env.BBOX_MAX_LNG) || 106.8400,
};

// Menghasilkan nilai acak dalam rentang tertentu
const rand = (min, max) => Math.random() * (max - min) + min;

// Menghasilkan koordinat latitude dan longitude acak
const randomCoord = () => ({
    latitude: rand(BBOX.MIN_LAT, BBOX.MAX_LAT),
    longitude: rand(BBOX.MIN_LNG, BBOX.MAX_LNG),
});

/**
 * Definisi skenario pengujian
 * Threshold mengacu pada utils/healthAssessment.js:
 *
 * Heart rate:
 *   normal = 60-100
 *   abnormal = <60 atau >100
 *
 * Temperature:
 *   normal = 36.4-37.6
 *   abnormal = <36.4 atau >37.6
 *
 * SpO2:
 *   normal >=95
 *   abnormal <95
 *
 * Fall:
 *   true = Emergency
 */

const SCENARIOS = {

    // Skenario normal
    normal: () => ({
        device_id: 'DEV001',
        heart_rate: 75,
        spo2: 98,
        temperature: 36.8,
        ...randomCoord(),
        fall_detected: false,
        activity_status: 'Active',
    }),

    // Skenario warning - 1 nilai vital abnormal
    warning: () => ({
        device_id: 'DEV002',
        heart_rate: 105,
        spo2: 97,
        temperature: 36.8,
        ...randomCoord(),
        fall_detected: false,
        activity_status: 'Active',
    }),

    // Skenario high risk - 2 nilai vital abnormal
    highrisk: () => ({
        device_id: 'DEV003',
        heart_rate: 55,
        spo2: 93,
        temperature: 36.8,
        ...randomCoord(),
        fall_detected: false,
        activity_status: 'Idle',
    }),

    // Skenario critical - 3 nilai vital abnormal
    critical: () => ({
        device_id: 'DEV004',
        heart_rate: 120,
        spo2: 92,
        temperature: 38.5,
        ...randomCoord(),
        fall_detected: false,
        activity_status: 'Active',
    }),

    // Skenario fall detection - fall_detected = true -> Emergency
    fall: () => ({
        device_id: 'DEV005',
        heart_rate: 130,
        spo2: 91,
        temperature: 38.2,
        ...randomCoord(),
        fall_detected: true,
        activity_status: 'Fall Detected',
    }),

    // Skenario device tidak terdaftar
    unknown: () => ({
        device_id: 'DEV999',
        heart_rate: 80,
        spo2: 97,
        temperature: 36.5,
        ...randomCoord(),
        fall_detected: false,
        activity_status: 'Active',
    }),
};

// Urutan perubahan kondisi satu device untuk menguji pembaruan volunteer card dan alert
const PROGRESSION = [

    // Kondisi normal
    {
        device_id: 'DEV001',
        heart_rate: 75,
        spo2: 98,
        temperature: 36.8,
        fall_detected: false,
        activity_status: 'Active',
    },

    // Kondisi warning
    {
        device_id: 'DEV001',
        heart_rate: 105,
        spo2: 97,
        temperature: 36.8,
        fall_detected: false,
        activity_status: 'Active',
    },

    // Kondisi high risk
    {
        device_id: 'DEV001',
        heart_rate: 55,
        spo2: 93,
        temperature: 36.8,
        fall_detected: false,
        activity_status: 'Idle',
    },

    // Kondisi critical
    {
        device_id: 'DEV001',
        heart_rate: 120,
        spo2: 92,
        temperature: 38.5,
        fall_detected: false,
        activity_status: 'Active',
    },

    // Kondisi fall detection - Emergency
    {
        device_id: 'DEV001',
        heart_rate: 130,
        spo2: 91,
        temperature: 38.2,
        fall_detected: true,
        activity_status: 'Fall Detected',
    },
];

// Mengirim satu skenario ke backend melalui HTTP POST
const runScenario = async (name) => {
    const data = SCENARIOS[name]();

    console.log(`\n[${name.toUpperCase()}] -> ${data.device_id}`);

    try {
        const response = await fetch(`${BACKEND_URL}/monitoring/simulator`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        console.log(`[Backend] HTTP ${response.status}`);
        console.log('[Backend] Response:', result);

    } 
    catch (error) {
        console.error(
            '[Simulator] Failed to send data to backend:',
            error.message
        );
    }
};

// Menjalankan progression satu device secara berulang
const runProgression = async () => {

    console.log(
        `Running progression scenario (interval 3s). Ctrl+C to stop.`
    );

    console.log(`Backend target: ${BACKEND_URL}\n`);

    let i = 0;

    setInterval(async () => {

        const progressionData = {
            ...PROGRESSION[i],
            ...randomCoord(),
        };

        console.log(
            `\n[PROGRESSION] -> ${progressionData.device_id}`
        );

        console.log(
            `[Condition] HR=${progressionData.heart_rate}, ` +
            `SpO2=${progressionData.spo2}, ` +
            `Temp=${progressionData.temperature}, ` +
            `Fall=${progressionData.fall_detected}`
        );

        try {
            const response = await fetch(`${BACKEND_URL}/monitoring/simulator`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(progressionData),
            });

            const result = await response.json();

            console.log(`[Backend] HTTP ${response.status}`);
            console.log('[Backend] Response:', result);

        } 
        catch (error) {
            console.error(
                '[Simulator] Failed to send data to backend:',
                error.message
            );
        }

        i = (i + 1) % PROGRESSION.length;

    }, 3000);
};

// Menentukan mode berdasarkan argument command line
const arg = process.argv[2];

if (arg === 'progression') {
    // Menjalankan progression satu device secara berulang
    runProgression();
} 
else if (arg && SCENARIOS[arg]) {
    // Menjalankan satu skenario saja
    (async () => {
        await runScenario(arg);
    })();
} 
else {
    // Menjalankan seluruh skenario secara berulang
    console.log(
        `Running all scenarios in loop (interval 3s). Ctrl+C to stop.`
    );

    console.log(`Backend target: ${BACKEND_URL}\n`);

    const names = Object.keys(SCENARIOS);
    let i = 0;

    setInterval(async () => {
        await runScenario(names[i % names.length]);
        i++;
    }, 3000);
}
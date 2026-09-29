const axios = require("axios");
const { io } = require("socket.io-client");
const { performance } = require("perf_hooks");

const API_URL = "http://localhost:7777";
const DEVICE_ID = "DEV001";

const TEST_COUNT = 100;
const INTERVAL_MS = 1000;

// Membuat koneksi WebSocket ke backend
const socket = io(API_URL);

// Menyimpan jumlah event berdasarkan hasil pengujian
let monitoringReceived = 0;
let alertReceived = 0;
let httpCompleted = 0;
let httpFailed = 0;

// Menyimpan response time setiap request untuk perhitungan statistik
const httpLatencies = [];

// Menyimpan status setiap event yang sedang diuji
const pendingTests = new Map();

// Websocket monitoring: menerima event monitoring dari backend dan mencatat event yang sesuai dengan pengujian
socket.on("monitoring:new", (data) => {
    console.log(
        `[WS monitoring:new] test_id=${data.test_id} fall=${data.fall_detected} severity=${data.severity}`
    );

    if (data.test_id && pendingTests.has(data.test_id)) {
        monitoringReceived++;
        pendingTests.get(data.test_id).monitoringReceived = true;
    }
});

// Websocket alert: menerima event alert dari backend dan mencatat alert yang dikirim
socket.on("alert:new", (data) => {
    console.log(
        `[WS alert:new] test_id=${data.test_id} type=${data.type} severity=${data.severity}`
    );

    alertReceived++;

    if (data.test_id && pendingTests.has(data.test_id)) {
        pendingTests.get(data.test_id).alertReceived = true;
    }
});

//Statistik response time: menghitung rata-rata, minimum, dan maksimum response time
function calculateStats(values) {
    if (values.length === 0) {
        return {
            average: 0,
            minimum: 0,
            maximum: 0,
        };
    }

    return {
        average: values.reduce((sum, value) => sum + value, 0) / values.length,
        minimum: Math.min(...values),
        maximum: Math.max(...values),
    };
}

// Pengujian: menjalankan pengiriman event fall secara berkala setelah WebSocket terhubung
socket.on("connect", async () => {
    console.log("=================================");
    console.log("       SENSERESQ FALL TEST");
    console.log("=================================");
    console.log(`Device       : ${DEVICE_ID}`);
    console.log(`Total data   : ${TEST_COUNT}`);
    console.log(`Frekuensi    : 1 event/detik`);
    console.log(`Interval     : ${INTERVAL_MS} ms`);
    console.log("");

    // Mengirim event fall sesuai jumlah dan interval pengujian
    for (let i = 1; i <= TEST_COUNT; i++) {
        await sendFallData(i);

        if (i < TEST_COUNT) {
            await sleep(INTERVAL_MS);
        }
    }

    console.log("");
    console.log("=================================");
    console.log("HASIL SEMENTARA");
    console.log("=================================");
    console.log(`Event dikirim       : ${TEST_COUNT}`);
    console.log(`HTTP berhasil       : ${httpCompleted}`);
    console.log(`HTTP gagal          : ${httpFailed}`);
    console.log(`Monitoring diterima : ${monitoringReceived}`);
    console.log(`Alert diterima      : ${alertReceived}`);
    console.log("");

    // Memberikan waktu tambahan untuk menerima event WebSocket terakhir
    console.log("Menunggu event WebSocket terakhir...");

    setTimeout(() => {
        console.log("");
        console.log("=================================");
        console.log("HASIL AKHIR");
        console.log("=================================");
        console.log(`Event dikirim       : ${TEST_COUNT}`);
        console.log(`HTTP berhasil       : ${httpCompleted}`);
        console.log(`HTTP gagal          : ${httpFailed}`);
        console.log(`Monitoring diterima : ${monitoringReceived}`);
        console.log(`Alert diterima      : ${alertReceived}`);
        console.log("");

        // Menghitung statistik response time seluruh request
        const stats = calculateStats(httpLatencies);

        console.log("");
        console.log("RESPONSE TIME");
        console.log(`Rata-rata response time : ${stats.average.toFixed(2)} ms`);
        console.log(`Minimum response time   : ${stats.minimum.toFixed(2)} ms`);
        console.log(`Maximum response time   : ${stats.maximum.toFixed(2)} ms`);

        // Menutup koneksi WebSocket setelah pengujian selesai
        socket.disconnect();
    }, 2000);
});

// Mengirim satu event fall ke endpoint simulator dan mengukur response time
async function sendFallData(index) {
    const testId =
        `FALL-${String(index).padStart(4, "0")}`;

    // Mencatat event yang sedang menunggu hasil dari WebSocket
    pendingTests.set(testId, {
        sentAt: performance.now(),
        monitoringReceived: false,
        alertReceived: false,
    });

    // Mencatat waktu sebelum request HTTP dikirim
    const requestStart = performance.now();

    try {
        await axios.post(
            `${API_URL}/monitoring/simulator`,
            {
                device_id: DEVICE_ID,

                heart_rate: 105,
                spo2: 98,
                temperature: 36.8,

                latitude: -6.348187890157792,
                longitude: 106.83703597671992,

                // Data simulasi kondisi jatuh
                fall_detected: true,
                activity_status: "Active",

                // ID untuk mengidentifikasi event pengujian
                test_id: testId,
            }
        );

        // Menghitung waktu yang dibutuhkan request HTTP sampai selesai
        const requestEnd = performance.now();
        const responseTime = requestEnd - requestStart;

        httpCompleted++;
        httpLatencies.push(responseTime);

        console.log(`[HTTP ${index}/${TEST_COUNT}] ${responseTime.toFixed(2)}ms test_id=${testId}`);

    } 
    catch (error) {
        // Mencatat request yang gagal dikirim atau diproses
        httpFailed++;

        console.error(
            `[HTTP ERROR] ${testId}:`,
            error.message
        );
    }
}

// Memberikan delay/jeda antar pengiriman event
function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
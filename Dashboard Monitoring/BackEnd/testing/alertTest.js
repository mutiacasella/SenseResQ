const axios = require("axios");
const { io } = require("socket.io-client");
const { performance } = require("perf_hooks");

// Alamat backend yang diuji
const API_URL = "http://localhost:7777";

// Device yang digunakan untuk simulasi
const DEVICE_ID = "DEV001";

// Daftar skenario pengujian sistem peringatan
const scenarios = [
    {
        name: "Warning",
        heart_rate: 105,
        spo2: 98,
        temperature: 36.8,
        fall_detected: false,
        expectedSeverity: "Warning",
        expectedType: "Fatigue Detection",
    },
    {
        name: "High Risk",
        heart_rate: 55,
        spo2: 93,
        temperature: 36.8,
        fall_detected: false,
        expectedSeverity: "High Risk",
        expectedType: "Fatigue Detection",
    },
    {
        name: "Critical",
        heart_rate: 120,
        spo2: 92,
        temperature: 38.5,
        fall_detected: false,
        expectedSeverity: "Critical",
        expectedType: "Fatigue Detection",
    },
    {
        name: "Fall",
        heart_rate: 75,
        spo2: 98,
        temperature: 36.8,
        fall_detected: true,
        expectedSeverity: "Emergency",
        expectedType: "Fall Detection",
    },
];

// Membuka koneksi WebSocket ke backend
const socket = io(API_URL);

// Menyimpan data pengujian yang sedang menunggu alert
const pendingTests = new Map();

// Menyimpan hasil setiap skenario pengujian
const results = [];

// Menerima alert baru dari backend melalui WebSocket
socket.on("alert:new", (data) => {
    const testId = data.test_id;

    // Mengabaikan alert yang tidak berasal dari pengujian ini
    if (!testId || !pendingTests.has(testId)) {
        return;
    }

    const test = pendingTests.get(testId);

    // Menghitung waktu dari pengiriman data sampai alert diterima
    const responseTime = performance.now() - test.startTime;

    // Memeriksa kesesuaian severity dengan hasil yang diharapkan
    const severityCorrect = data.severity === test.expectedSeverity;

    // Memeriksa kesesuaian jenis alert dengan hasil yang diharapkan
    const typeCorrect = data.type === test.expectedType;

    // Menyimpan hasil pengujian
    results.push({
        name: test.name,
        responseTime,
        severityCorrect,
        typeCorrect,
    });

    console.log(
        `[WS alert:new] ${test.name} | ` +
        `type=${data.type} | ` +
        `severity=${data.severity} | ` +
        `${responseTime.toFixed(2)}ms`
    );

    // Menghapus data pengujian yang sudah selesai
    pendingTests.delete(testId);
});

// Menjalankan pengujian setelah WebSocket berhasil terhubung
socket.on("connect", async () => {
    console.log("=================================");
    console.log("       SENSERESQ ALERT TEST");
    console.log("=================================");
    console.log(`Device : ${DEVICE_ID}`);
    console.log(`Total  : ${scenarios.length} skenario`);
    console.log("");

    // Menjalankan seluruh skenario secara berurutan
    for (let i = 0; i < scenarios.length; i++) {
        await sendAlertTest(scenarios[i], i + 1);

        // Memberikan jeda antar skenario
        await sleep(1500);
    }

    // Memberikan waktu untuk menerima alert terakhir
    await sleep(1000);

    // Menampilkan hasil seluruh pengujian
    printResults();

    // Menutup koneksi WebSocket
    socket.disconnect();
});

// Mengirim data simulasi untuk satu skenario peringatan
async function sendAlertTest(scenario, index) {

    // Membuat ID unik untuk setiap skenario
    const testId = `ALERT-${String(index).padStart(3, "0")}`;

    // Menyimpan informasi pengujian sebelum data dikirim
    pendingTests.set(testId, {
        name: scenario.name,
        expectedSeverity: scenario.expectedSeverity,
        expectedType: scenario.expectedType,
        startTime: performance.now(),
    });

    console.log("---------------------------------");
    console.log(`SKENARIO ${index}: ${scenario.name}`);
    console.log("---------------------------------");
    console.log(`HR          : ${scenario.heart_rate}`);
    console.log(`SpO2        : ${scenario.spo2}`);
    console.log(`Temperature : ${scenario.temperature}`);
    console.log(`Fall        : ${scenario.fall_detected}`);
    console.log(`Expected    : ${scenario.expectedSeverity}`);
    console.log("");

    try {
        // Mengirim data sensor ke endpoint simulator backend
        await axios.post(
            `${API_URL}/monitoring/simulator`,
            {
                device_id: DEVICE_ID,

                heart_rate: scenario.heart_rate,
                spo2: scenario.spo2,
                temperature: scenario.temperature,

                latitude: -6.348187890157792,
                longitude: 106.83703597671992,

                fall_detected: scenario.fall_detected,
                activity_status: "Active",

                test_id: testId,
            }
        );

        console.log(`[HTTP] ${testId} berhasil dikirim`);

    } 
    catch (error) {
        // Menampilkan error apabila pengiriman data gagal
        console.error(`[HTTP ERROR] ${testId}:`, error.message);
    }
}

// Memberikan jeda sebelum menjalankan skenario berikutnya
function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

// Menampilkan ringkasan hasil pengujian
function printResults() {
    console.log("");
    console.log("=================================");
    console.log("          HASIL AKHIR");
    console.log("=================================");

    // Menampilkan hasil setiap skenario
    for (const result of results) {
        const status = result.severityCorrect && result.typeCorrect ? "TERPENUHI" : "TIDAK TERPENUHI";

        console.log(
            `${result.name.padEnd(12)} | ` +
            `${result.responseTime.toFixed(2)} ms | ` +
            `Severity=${result.severityCorrect ? "OK" : "SALAH"} | ` +
            `Type=${result.typeCorrect ? "OK" : "SALAH"} | ` +
            status
        );
    }

    // Menghitung statistik response time seluruh skenario
    if (results.length > 0) {
        const responseTimes = results.map(result => result.responseTime);

        const average = responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length;

        console.log("");
        console.log("RESPONSE TIME");
        console.log(`Rata-rata : ${average.toFixed(2)} ms`);
        console.log(`Minimum   : ${Math.min(...responseTimes).toFixed(2)} ms`);
        console.log(`Maximum   : ${Math.max(...responseTimes).toFixed(2)} ms`);
    }
}
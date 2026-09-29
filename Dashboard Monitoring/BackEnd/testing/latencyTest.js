const axios = require("axios");
const { io } = require("socket.io-client");
const { performance } = require("perf_hooks");

const API_URL = "http://localhost:7777";

const TEST_COUNT = 100;
const DEVICE_ID = "DEV001";

// 1 data setiap 1 detik
const INTERVAL_MS = 1000;

const socket = io(API_URL);

const pendingTests = new Map();
const results = [];

let httpCompleted = 0;
let httpFailed = 0;
let wsCompleted = 0;

let testStartTime = null;
let testEndTime = null;

// Websocket
socket.on("monitoring:new", (data) => {
    // Hanya proses event yang berasal dari latency test
    if (!data.test_id) {
        return;
    }

    const test = pendingTests.get(data.test_id);

    if (!test) {
        return;
    }

    // Waktu ketika event WebSocket diterima
    // Menggunakan clock yang sama dengan sentAt
    test.receivedAt = performance.now();
    test.wsReceived = true;

    tryFinishTest(data.test_id);
});

// Menyelesaikan satu data
function tryFinishTest(testId) {
    const test = pendingTests.get(testId);

    if (!test) {
        return;
    }

    // Tunggu sampai HTTP dan WebSocket selesai
    if (test.httpLatency === null || !test.wsReceived) {
        return;
    }

    // HTTP ingestion latency, sudah dihitung ketika HTTP response diterima
    const httpLatency = test.httpLatency;

    // End-to-end latency, mulai dari simulator mengirim request sampai WebSocket diterima oleh client
    const endToEndLatency = test.receivedAt - test.sentAt;

    results.push({
        test_id: testId,
        httpLatency,
        endToEndLatency,
    });

    wsCompleted++;

    console.log(
        `[${wsCompleted}/${TEST_COUNT}]`,
        `HTTP=${httpLatency.toFixed(2)}ms`,
        `E2E=${endToEndLatency.toFixed(2)}ms`
    );

    pendingTests.delete(testId);

    // Semua data sudah diterima
    if (wsCompleted === TEST_COUNT) {
        testEndTime = performance.now();

        printResults();

        socket.disconnect();
    }
}

// Mengirim satu data monitoring
async function sendTestData(index) {
    const testId =
        `LAT-${String(index).padStart(4, "0")}`;

    // Clock khusus pengukuran latency
    const sentAt = performance.now();

    pendingTests.set(testId, {
        sentAt,

        httpLatency: null,

        wsReceived: false,
        receivedAt: null,
    });

    // Mulai stopwatch HTTP
    const requestStart = performance.now();

    try {
        await axios.post(
            `${API_URL}/monitoring/simulator`,
            {
                device_id: DEVICE_ID,

                heart_rate: 75,
                spo2: 98,
                temperature: 36.8,

                latitude: -6.348187890157792,
                longitude: 106.83703597671992,

                fall_detected: false,
                activity_status: "Active",

                // Metadata khusus pengujian
                test_id: testId,
            }
        );

        // HTTP response diterima
        const requestEnd = performance.now();

        const httpLatency = requestEnd - requestStart;

        httpCompleted++;

        const test = pendingTests.get(testId);

        if (test) {
            test.httpLatency = httpLatency;

            // WebSocket mungkin sudah diterima lebih dulu
            tryFinishTest(testId);
        }

    } 
    catch (error) {
        httpFailed++;

        console.error(
            `[HTTP ERROR] ${testId}:`,
            error.message
        );

        pendingTests.delete(testId);
    }
}

// Menjalankan pengujian
socket.on("connect", async () => {
    console.log("=================================");
    console.log("     SENSERESQ LATENCY TEST");
    console.log("=================================");
    console.log(`Device       : ${DEVICE_ID}`);
    console.log(`Total data   : ${TEST_COUNT}`);
    console.log(`Frekuensi    : 1 data/detik`);
    console.log(`Interval     : ${INTERVAL_MS} ms`);
    console.log("");

    testStartTime = performance.now();

    // Mengirim satu data setiap 1 detik
    for (let i = 1; i <= TEST_COUNT; i++) {

        await sendTestData(i);

        // Tidak menunggu setelah data terakhir
        if (i < TEST_COUNT) {
            await sleep(INTERVAL_MS);
        }
    }

    console.log("");
    console.log("Semua request HTTP selesai dikirim.");
});

// Delay
function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

// Percentile
function percentile(values, percentile) {
    if (values.length === 0) {
        return 0;
    }

    const sorted = [...values].sort(
        (a, b) => a - b
    );

    const index =
        Math.ceil(
            (percentile / 100) * sorted.length
        ) - 1;

    return sorted[Math.max(0, index)];
}

// Statistik
function calculateStats(values) {
    if (values.length === 0) {
        return {
            min: 0,
            avg: 0,
            max: 0,
            p95: 0,
        };
    }

    return {
        min: Math.min(...values),

        avg:
            values.reduce(
                (sum, value) => sum + value,
                0
            ) / values.length,

        max: Math.max(...values),

        p95: percentile(values, 95),
    };
}

// Hasil akhir
function printResults() {
    const httpValues = results.map(r => r.httpLatency).filter(Number.isFinite);
    const e2eValues = results.map(r => r.endToEndLatency).filter(Number.isFinite);

    const httpStats = calculateStats(httpValues);
    const e2eStats = calculateStats(e2eValues);

    const actualDuration = testEndTime - testStartTime;
    const targetDuration = (TEST_COUNT - 1) * INTERVAL_MS;

    console.log("");
    console.log("=================================");
    console.log("       HASIL LATENCY TEST");
    console.log("=================================");

    console.log("");
    console.log("KONFIGURASI PENGUJIAN");
    console.log(`Jumlah device        : 1`);
    console.log(`Frekuensi data       : 1 data/detik`);
    console.log(`Target durasi        : ${(targetDuration / 1000).toFixed(0)} detik`);
    console.log(`Durasi aktual        : ${(actualDuration / 1000).toFixed(2)} detik`);
    console.log(`Total data           : ${TEST_COUNT}`);
    console.log("");
    console.log("DATA");
    console.log(`Dikirim              : ${TEST_COUNT}`);
    console.log(`HTTP berhasil        : ${httpCompleted}`);
    console.log(`HTTP gagal           : ${httpFailed}`);
    console.log(`WebSocket diterima   : ${wsCompleted}`);
    console.log(`Data gagal/hilang    : ${TEST_COUNT - wsCompleted}`);
    console.log("");
    console.log("HTTP INGESTION LATENCY");
    console.log(`Min                  : ${httpStats.min.toFixed(2)} ms`);
    console.log(`Average              : ${httpStats.avg.toFixed(2)} ms`);
    console.log(`Max                  : ${httpStats.max.toFixed(2)} ms`);
    console.log("");
    console.log("END-TO-END LATENCY");
    console.log(`Min                  : ${e2eStats.min.toFixed(2)} ms`);
    console.log(`Average              : ${e2eStats.avg.toFixed(2)} ms`);
    console.log(`Max                  : ${e2eStats.max.toFixed(2)} ms`);
    console.log(`P95                  : ${e2eStats.p95.toFixed(2)} ms`);
    console.log("");
    console.log("=================================");
}
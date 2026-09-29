const axios = require("axios");
const { io } = require("socket.io-client");
const testStartTime = Date.now();

const API_URL = "http://localhost:7777";
const DEVICES = ["DEV001", "DEV002", "DEV003", "DEV004", "DEV005"];

// Konfigurasi Stress Test
// Beban dinaikkan secara bertahap untuk mengetahui batas kemampuan sistem.
const SCENARIOS = [
    {
        name: "Baseline",
        devices: 5,
        frequency: 5,
        duration: 10,
    },
    {
        name: "Beban 1",
        devices: 5,
        frequency: 10,
        duration: 10,
    },
    {
        name: "Beban 2",
        devices: 5,
        frequency: 20,
        duration: 10,
    },
    {
        name: "Beban 3",
        devices: 5,
        frequency: 50,
        duration: 10,
    },
    {
        name: "Beban maksimum",
        devices: 5,
        frequency: 100,
        duration: 10,
    },
];

// Menunggu selama jumlah milidetik tertentu.
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

// Menghitung percentile dari kumpulan nilai latency.
const calculatePercentile = (values, percentile) => {
    if (values.length === 0) {
        return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);

    const index = Math.ceil((percentile / 100) * sorted.length) - 1;

    return sorted[Math.max(0, index)];
};

// Membuat data sensor untuk setiap device.
const createTestData = (deviceId, sequence) => {
    return {
        device_id: deviceId,

        heart_rate: 75,
        spo2: 98,
        temperature: 36.8,

        latitude: -6.3565,
        longitude: 106.8275,

        fall_detected: false,
        activity_status: "Active",

        // ID ini digunakan untuk membedakan data stress test.
        test_id: `STRESS-${Date.now()}-${deviceId}-${sequence}`,
    };
};

// Menjalankan satu skenario stress test.
const runScenario = async (scenario, socket) => {
    console.log("");
    console.log("=================================");
    console.log(`       SKENARIO: ${scenario.name}`);
    console.log("=================================");
    console.log(`Jumlah device     : ${scenario.devices}`);
    console.log(`Frekuensi/device  : ${scenario.frequency} data/s`);
    console.log(`Total target      : ${scenario.devices * scenario.frequency} data/s`);
    console.log(`Durasi            : ${scenario.duration} detik`);
    console.log("");

    const totalTargetPerSecond = scenario.devices * scenario.frequency;
    const intervalMs = 1000 / totalTargetPerSecond;
    const totalExpected = totalTargetPerSecond * scenario.duration;

    let sent = 0;
    let success = 0;
    let failed = 0;

    const latencies = [];

    let websocketReceived = 0;
    let websocketDisconnects = 0;

    // Mencatat status koneksi WebSocket selama skenario berjalan.
    const disconnectHandler = () => {
        websocketDisconnects++;
    };

    socket.on("disconnect", disconnectHandler);

    const startTime = Date.now();

    // Mengirim request secara bertahap berdasarkan target throughput.
    while (Date.now() - startTime < scenario.duration * 1000) {
        const deviceId = DEVICES[sent % scenario.devices];
        const data = createTestData(deviceId, sent);

        sent++;

        const requestStart = process.hrtime.bigint();

        axios
            .post(`${API_URL}/monitoring/simulator`, data)
            .then(() => {
                const requestEnd = process.hrtime.bigint();

                const latency =
                    Number(requestEnd - requestStart) / 1_000_000;

                latencies.push(latency);
                success++;
            })
            .catch(() => {
                failed++;
            });

        await sleep(intervalMs);
    }

    // Memberikan waktu kepada request terakhir untuk selesai.
    await sleep(2000);

    const actualDuration =
        (Date.now() - startTime) / 1000;

    const averageLatency = latencies.length > 0 ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : 0;
    const p95 = calculatePercentile(latencies, 95);
    const throughput = actualDuration > 0 ? success / actualDuration : 0;

    socket.off("disconnect", disconnectHandler);

    console.log("---------------------------------");
    console.log("         HASIL SKENARIO");
    console.log("---------------------------------");
    console.log("Data target       :", totalExpected);
    console.log("Data dikirim      :", sent);
    console.log("Berhasil diproses :", success);
    console.log("Gagal             :", failed);

    console.log("Avg latency       :", averageLatency.toFixed(2), "ms");
    console.log("P95 latency       :",p95.toFixed(2), "ms");
    console.log("Throughput aktual :", throughput.toFixed(2), "data/s");
    console.log("WS disconnect     :", websocketDisconnects);
    console.log("Durasi aktual     :", actualDuration.toFixed(2),"detik");

    return {
        name: scenario.name,
        target: totalExpected,
        sent,
        success,
        failed,
        averageLatency,
        p95,
        throughput,
        websocketDisconnects,
        actualDuration,
    };
};

// Main Program
const main = async () => {
    console.log("=================================");
    console.log("      SENSERESQ STRESS TEST");
    console.log("=================================");
    console.log("");
    console.log("Server :", API_URL);
    console.log("Device :", DEVICES.join(", "));
    console.log("");

    // Membuka koneksi WebSocket untuk memantau kestabilan koneksi.
    const socket = io(API_URL);

    await new Promise((resolve) => {
        socket.on("connect", () => {
            console.log("WebSocket connected.");
            console.log("");
            resolve();
        });

        socket.on("connect_error", (error) => {
            console.error("WebSocket connection error:", error.message);
            resolve();
        });
    });

    // Menghitung jumlah event monitoring yang diterima melalui WebSocket.
    socket.on("monitoring:new", () => {
        // Event diterima sebagai indikator bahwa backend
        // masih mengirimkan hasil pemrosesan secara real-time.
    });

    const results = [];

    // Menjalankan seluruh skenario secara berurutan.
    for (const scenario of SCENARIOS) {
        try {
            const result = await runScenario(
                scenario,
                socket
            );

            results.push(result);

            // Jeda antar-skenario agar sistem memiliki waktu
            // menyelesaikan proses yang masih tertunda.
            await sleep(3000);
        } 
        catch (error) {
            console.error(
                `Skenario ${scenario.name} gagal dijalankan:`,
                error.message
            );

            results.push({
                name: scenario.name,
                target: 0,
                sent: 0,
                success: 0,
                failed: 0,
                averageLatency: 0,
                p95: 0,
                throughput: 0,
                websocketDisconnects: 0,
                actualDuration: 0,
            });
        }
    }

    console.log("");
    console.log("=================================");
    console.log("     HASIL AKHIR STRESS TEST");
    console.log("=================================");
    console.log("Skenario | Kirim | Sukses | Gagal | Avg | P95 | Throughput");
    console.log("---------------------------------");

    results.forEach((result) => {
        console.log(
            `${result.name} | ` +
            `${result.sent} | ` +
            `${result.success} | ` +
            `${result.failed} | ` +
            `${result.averageLatency.toFixed(2)} ms | ` +
            `${result.p95.toFixed(2)} ms | ` +
            `${result.throughput.toFixed(2)} data/s`
        );
    });

    console.log("");

    // Menghitung durasi keseluruhan stress test
    const totalTestDuration = (Date.now() - testStartTime) / 1000;

    // Menghitung total hasil dari seluruh skenario.
    const totalProcessed = results.reduce(
        (total, result) => total + result.success,
        0
    );

    const totalFailed = results.reduce(
        (total, result) => total + result.failed,
        0
    );

    // Menjumlahkan seluruh WebSocket disconnect selama pengujian.
    const totalWsDisconnect = results.reduce(
        (total, result) => total + result.websocketDisconnects,
        0
    );

    console.log("");
    console.log("=================================");
    console.log("       STABILITAS SISTEM");
    console.log("=================================");
    console.log("Durasi pengujian total :",totalTestDuration.toFixed(2),"detik");
    console.log("Total data diproses    :", totalProcessed);
    console.log("Total error            :", totalFailed);
    console.log("WebSocket disconnect   :", totalWsDisconnect);
    console.log("Stress test selesai");

    socket.disconnect();
};

main();
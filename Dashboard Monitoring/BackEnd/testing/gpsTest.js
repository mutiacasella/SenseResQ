const axios = require("axios");
const { io } = require("socket.io-client");

// Interval pengiriman antar posisi
const UPDATE_INTERVAL = 1000;

// =================================
// Data posisi yang diuji
// =================================
// Semua koordinat berada di dalam bounding box yang digunakan oleh serialService.js
//
// Posisi dibuat bergerak:
// 1. Tengah
// 2. Ke kanan
// 3. Ke atas
// 4. Ke kiri
// 5. Ke bawah

const positions = [
    {
        name: "Posisi 1 - Tengah",
        latitude: -6.3565,
        longitude: 106.8275,
    },
    {
        name: "Posisi 2 - Ke kanan",
        latitude: -6.3565,
        longitude: 106.8325,
    },
    {
        name: "Posisi 3 - Ke atas",
        latitude: -6.3465,
        longitude: 106.8325,
    },
    {
        name: "Posisi 4 - Ke kiri",
        latitude: -6.3465,
        longitude: 106.8225,
    },
    {
        name: "Posisi 5 - Ke bawah",
        latitude: -6.3665,
        longitude: 106.8225,
    },
];

// Koneksi WebSocket
const socket = io(SERVER_URL);

let receivedUpdates = [];

// Menerima update posisi dari backend melalui WebSocket
socket.on("monitoring:new", (data) => {
    // Hanya mengambil data dari device yang sedang diuji
    if (data.device_id !== DEVICE_ID) {
        return;
    }

    receivedUpdates.push({
        x: data.x,
        y: data.y,
        timestamp: Date.now(),
    });

    console.log("\n[WEBSOCKET] GPS UPDATE DITERIMA");
    console.log("---------------------------------");
    console.log(`X         : ${data.x}`);
    console.log(`Y         : ${data.y}`);
    console.log(`Timestamp : ${data.timestamp}`);
});

// Delay
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Mengirim data GPS ke simulator
async function sendGPSData(position, index) {
    const payload = {
        device_id: DEVICE_ID,

        // Data vital dibuat normal agar pengujian hanya fokus pada GPS
        heart_rate: 80,
        spo2: 98,
        temperature: 36.8,

        // Data GPS yang sedang diuji
        latitude: position.latitude,
        longitude: position.longitude,

        fall_detected: false,
        activity_status: "Active",

        // Identitas pengujian
        test_id: `GPS-${String(index + 1).padStart(3, "0")}`,
    };

    console.log("\n=================================");
    console.log(`UPDATE ${index + 1}/5`);
    console.log("=================================");
    console.log(position.name);
    console.log(`Latitude  : ${position.latitude}`);
    console.log(`Longitude : ${position.longitude}`);

    const startTime = performance.now();

    try {
        await axios.post(
            `${SERVER_URL}/monitoring/simulator`,
            payload
        );

        const responseTime = performance.now() - startTime;

        console.log(`[HTTP] Berhasil`);
        console.log(`[HTTP] Response time: ${responseTime.toFixed(2)} ms`);

        return true;
    }
    catch (error) {
        console.error("[HTTP] Gagal mengirim data GPS");

        if (error.response) {
            console.error(`Status: ${error.response.status}`);
        }
        else {
            console.error(error.message);
        }

        return false;
    }
}

// Menjalankan pengujian
async function runTest() {
    console.log("=================================");
    console.log("      SENSERESQ GPS TEST");
    console.log("=================================");
    console.log(`Device   : ${DEVICE_ID}`);
    console.log(`Update   : ${positions.length}`);
    console.log(`Interval : ${UPDATE_INTERVAL} ms`);

    // Menunggu sampai WebSocket terkoneksi
    await new Promise((resolve) => {
        if (socket.connected) {
            resolve();
        }
        else {
            socket.once("connect", resolve);
        }
    });

    console.log("Socket connected.");

    let success = 0;
    let failed = 0;

    // Mengirim setiap posisi secara berurutan
    for (let i = 0; i < positions.length; i++) {
        const result = await sendGPSData(
            positions[i],
            i
        );

        if (result) {
            success++;
        }
        else {
            failed++;
        }

        // Memberikan jeda sebelum mengirim posisi berikutnya
        if (i < positions.length - 1) {
            await sleep(UPDATE_INTERVAL);
        }
    }

    // Memberikan waktu agar event WebSocket terakhir diterima
    await sleep(500);

    // Hasil akhir
    console.log("\n=================================");
    console.log("          HASIL AKHIR");
    console.log("=================================");

    console.log(`Jumlah update : ${positions.length}`);
    console.log(`HTTP berhasil : ${success}`);
    console.log(`HTTP gagal    : ${failed}`);

    console.log(`WebSocket diterima : ${receivedUpdates.length}`);

    console.log("\nRIWAYAT POSISI");
    console.log("---------------------------------");

    receivedUpdates.forEach((data, index) => {
        console.log(`${index + 1}. X=${data.x.toFixed(4)}, Y=${data.y.toFixed(4)}`);
    });

    const allReceived = receivedUpdates.length === positions.length;

    console.log("\nSTATUS GPS");
    console.log("---------------------------------");

    if (success === positions.length && allReceived) {
        console.log("Semua update GPS berhasil diterima.");
        console.log("Status : TERPENUHI");
    }
    else {
        console.log("Terdapat update GPS yang tidak diterima.");
        console.log("Status : TIDAK TERPENUHI");
    }

    socket.disconnect();
}

runTest();
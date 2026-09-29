const axios = require("axios");
const { io } = require("socket.io-client");

const API_URL = "http://localhost:7777";
const DEVICE_ID = "DEV001";
const TEST_ID = "INTEGRITY-001";

const socket = io(API_URL);

const testData = {
    device_id: DEVICE_ID,

    heart_rate: 105,
    spo2: 98,
    temperature: 36.8,

    latitude: -6.348187890157792,
    longitude: 106.83703597671992,

    fall_detected: true,
    activity_status: "Active",

    test_id: TEST_ID,
};

console.log("=================================");
console.log("   SENSERESQ DATA INTEGRITY TEST");
console.log("=================================");
console.log("");

// Menampilkan data yang dikirim oleh simulator
console.log("DATA SIMULATOR");
console.log("---------------------------------");
console.log(JSON.stringify(testData, null, 2));
console.log("");

socket.on("monitoring:new", (data) => {
    // Menerima hasil pemrosesan backend melalui WebSocket
    if (data.test_id === TEST_ID) {
        console.log("DATA BACKEND / WEBSOCKET");
        console.log("---------------------------------");
        console.log(JSON.stringify(data, null, 2));
        console.log("");

        console.log("=================================");
        console.log("HASIL");
        console.log("=================================");
        console.log("Event monitoring diterima : YA");
        console.log("Test ID                   :", data.test_id);
        console.log("Heart rate                :", data.heart_rate);
        console.log("SpO2                      :", data.spo2);
        console.log("Suhu                      :", data.temperature);
        console.log("Fall                      :", data.fall_detected);
        console.log("Activity status           :", data.activity_status);
        console.log("Fatigue score             :", data.fatigue_score);
        console.log("Severity                  :", data.severity);
        console.log("X                         :", data.x);
        console.log("Y                         :", data.y);

        console.log("");
        console.log("Selanjutnya cek data yang sama pada database");
        console.log("dan dashboard.");

        setTimeout(() => {
            socket.disconnect();
        }, 500);
    }
});

socket.on("connect", async () => {
    console.log("Socket connected.");
    console.log("");

    try {
        const response = await axios.post(
            `${API_URL}/monitoring/simulator`,
            testData
        );

        console.log("HTTP RESPONSE");
        console.log("---------------------------------");
        console.log("Status :", response.status);
        console.log("Message:", response.data.message);
        console.log("");
    } 
    catch (error) {
        console.error("HTTP ERROR:", error.message);
        socket.disconnect();
    }
});
const { io } = require("socket.io-client");

// Menghubungkan client ke server backend Socket.IO
const socket = io("http://localhost:7777");

// Berjalan ketika berhasil terhubung ke server
socket.on("connect", () => {
    console.log("Connected!");
});

// Mendengarkan broadcast data monitoring baru secara real-time
socket.on("monitoring:new", (data) => {
    console.log("Monitoring:", data);
});

// Mendengarkan broadcast peringatan baru secara real-time
socket.on("alert:new", (data) => {
    console.log("Alert:", data);
});
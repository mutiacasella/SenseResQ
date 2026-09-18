const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./config/database.js");

const http = require("http");
const { Server } = require("socket.io");
const { initSocket } = require("./utils/socket");

const deviceRoutes = require("./modules/device/device.route");
const volunteerRoutes = require("./modules/volunteer/volunteer.route");
const monitoringRoutes = require("./modules/monitoring/monitoring.route");
const alertRoutes = require("./modules/alert/alert.route");

const app = express();
const server = http.createServer(app);

// Inisialisasi Socket.IO dan konfigurasi CORS
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// Menyimpan instance io agar dapat diakses secara global
initSocket(io);

const PORT = process.env.PORT || 7777;

app.use(cors());
app.use(express.json());

// Pendaftaran endpoint routes
app.use(deviceRoutes);
app.use(volunteerRoutes);
app.use(monitoringRoutes);
app.use(alertRoutes);

// Menangani event koneksi client melalui WebSocket
io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

app.get("/", (req, res) => {
    res.send("SenseResQ Backend is running!");
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const pool = require('./config/database');
const http = require('http');
const { Server } = require('socket.io');
const { initSocket } = require('./utils/socket');
const { getSerialStatus } = require('./utils/serialStatus');
const { initSerial } = require('./services/serialService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] } });
initSocket(io);

app.use(express.json());
// Hanya dipakai saat frontend development berjalan pada port 5173
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(require('./modules/device/device.route'));
app.use(require('./modules/volunteer/volunteer.route'));
app.use(require('./modules/monitoring/monitoring.route'));
app.use(require('./modules/alert/alert.route'));

app.get('/health', async (req, res) => {
    let database = 'disconnected';
    try { await pool.query('SELECT 1'); database = 'connected'; } catch (error) { /* ditampilkan sebagai disconnected */ }
    res.json({ success: true, backend: 'connected', database, serial: getSerialStatus() });
});

// Setelah npm run build, frontend disajikan dari Express tanpa server Vite terpisah
const distPath = path.resolve(__dirname, '../../FrontEnd/dist');
if (fs.existsSync(path.join(distPath, 'index.html'))) {
    app.use(express.static(distPath));
    app.get('/{*path}', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
    app.get('/', (req, res) => res.send('Backend SenseResQ aktif. Jalankan build frontend terlebih dahulu.'));
}

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
});

// Bound loopback saja: prototipe tidak mengekspos endpoint admin ke jaringan posko
const PORT = Number(process.env.PORT) || 7777;
server.listen(PORT, '127.0.0.1', () => {
    console.log(`SenseResQ siap: http://127.0.0.1:${PORT}`);
    initSerial();
});
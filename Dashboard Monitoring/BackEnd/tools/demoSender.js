// Backup demonstrasi TANPA hardware, digunakan hanya dengan MOCK_MODE=true
// Perangkat dan relawan harus didaftarkan terlebih dahulu melalui dashboard
require('dotenv').config();
const deviceId = process.argv[2] || 'DEV001';
const port = Number(process.env.PORT) || 7777;
const server = `http://127.0.0.1:${port}`;
const latMin = Number(process.env.BBOX_MIN_LAT) || -6.385;
const latMax = Number(process.env.BBOX_MAX_LAT) || -6.345;
const lngMin = Number(process.env.BBOX_MIN_LNG) || 106.815;
const lngMax = Number(process.env.BBOX_MAX_LNG) || 106.840;
let tick = 0;

const states = [
  { heart_rate: 85, spo2: 98, temperature: 36.9, fall_detected: false, activity_status: 'Active' },
  { heart_rate: 179, spo2: 98, temperature: 36.9, fall_detected: false, activity_status: 'Active' },
  { heart_rate: 100, spo2: 94, temperature: 38.0, fall_detected: false, activity_status: 'Idle' },
  { heart_rate: 120, spo2: 94, temperature: 38.0, fall_detected: true, activity_status: 'Fall Detected' },
  { heart_rate: 82, spo2: 99, temperature: 37.0, fall_detected: false, activity_status: 'Active' },
];
const send = async () => {
  try {
    const health = await fetch(`${server}/health`).then(r => r.json());
    if (health.serial?.status !== 'mock') {
      console.error('DIBATALKAN: jalankan backend dengan MOCK_MODE=true untuk simulasi.');
      process.exit(1);
    }
    const sensor = states[Math.floor(tick / 5) % states.length];
    tick++;
    const body = {
      device_id: deviceId, ...sensor,
      latitude: (latMin + latMax) / 2 + Math.sin(tick) * 0.001,
      longitude: (lngMin + lngMax) / 2 + Math.cos(tick) * 0.001,
    };
    const response = await fetch(`${server}/monitoring/simulator`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log(`[DEMO] ${new Date().toLocaleTimeString()} => ${deviceId}; langkah ${tick}; ${sensor.activity_status}`);
  } catch (error) {
    console.error('Simulator gagal:', error.message);
  }
};
console.log(`MODE SIMULASI - data buatan untuk ${deviceId}. Tekan Ctrl+C untuk berhenti.`);
void send();
setInterval(() => void send(), 1000);
import axios from 'axios';
// Pada build produksi, REST API dan dashboard berasal dari server yang sama
// Pada development, frontend Vite menggunakan backend localhost port 7777
const api = axios.create({
  baseURL: import.meta.env.DEV
    ? (import.meta.env.VITE_API_URL || 'http://127.0.0.1:7777')
    : '',
  headers: { 'Content-Type': 'application/json' },
});
export default api;

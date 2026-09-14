import axios from "axios";

// Menyiapkan koneksi utama ke endpoint backend
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;
import api from "./api";

// Mengambil data daftar peringatan dari backend
export async function getAlerts() {
    const response = await api.get("/alert");
    return response.data.data;
}
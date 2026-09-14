import api from "./api";

// Mengambil data daftar relawan dari backend
export async function getVolunteers() {
    const response = await api.get("/dashboard/volunteers");
    return response.data.data;
}
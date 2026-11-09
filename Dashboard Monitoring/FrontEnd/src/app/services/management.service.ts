import api from './api';

export interface AvailableVolunteer {
  volunteer_id: string;
  name: string;
  device_id: string;
}

// Perangkat dapat digunakan kembali selama tidak sedang memiliki penugasan aktif
async function ensureDevice(deviceId: string) {
  const response = await api.get('/device');
  const devices = response.data.data as Array<{device_id: string}>;
  if (!devices.some((device) => device.device_id === deviceId)) {
    await api.post('/device', { device_id: deviceId });
  }
}

export async function registerVolunteerWithDevice(volunteer_id: string, name: string, device_id: string) {
  await ensureDevice(device_id);
  await api.post('/volunteer', { volunteer_id, name, device_id });
}

export async function getInactiveVolunteers(): Promise<AvailableVolunteer[]> {
  const response = await api.get('/volunteer/inactive');
  return response.data.data;
}

export async function reactivateVolunteer(volunteerId: string, deviceId: string) {
  await ensureDevice(deviceId);
  await api.post(`/volunteer/${encodeURIComponent(volunteerId)}/activate`, { device_id: deviceId });
}

export async function updateVolunteer(volunteerId: string, name: string, deviceId: string) {
  await ensureDevice(deviceId);
  await api.put(`/volunteer/${encodeURIComponent(volunteerId)}`, { name, device_id: deviceId });
}

// Mengakhiri penugasan, tanpa menghapus identitas dan riwayat monitoring
export async function archiveVolunteer(volunteerId: string) {
  await api.delete(`/volunteer/${encodeURIComponent(volunteerId)}`);
}

import { useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Volunteer } from '../../types/volunteer';
import { updateVolunteer } from '../services/management.service';

interface Props { volunteer: Volunteer; onClose: () => void; onUpdated: () => Promise<void>; }

export function EditVolunteerModal({ volunteer, onClose, onUpdated }: Props) {
  const [name, setName] = useState(volunteer.name);
  const [device, setDevice] = useState(volunteer.device_id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const changedDevice = device.trim() !== volunteer.device_id;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!name.trim() || !device.trim()) { setError('Nama dan ID perangkat wajib diisi.'); return; }
    setSaving(true);
    try {
      await updateVolunteer(volunteer.volunteer_id, name.trim(), device.trim());
      await onUpdated();
      onClose();
    } catch (err: unknown) {
      const remote = err as { response?: { data?: { message?: string } } };
      setError(remote.response?.data?.message || 'Perubahan gagal. Periksa koneksi dan perangkat yang dipilih.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="edit-volunteer-title" className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl">
        <header className="flex justify-between items-center mb-4">
          <h2 id="edit-volunteer-title" className="text-xl font-semibold">Edit Relawan</h2>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Tutup form"><X className="w-5 h-5" /></button>
        </header>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">ID Relawan
            <input value={volunteer.volunteer_id} disabled className="block w-full border rounded-lg p-2 mt-1 bg-gray-100 text-gray-600" />
          </label>
          <label className="block text-sm font-medium">Nama Relawan
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} className="block w-full border rounded-lg p-2 mt-1" required />
          </label>
          <label className="block text-sm font-medium">ID Perangkat
            <input value={device} onChange={(e) => setDevice(e.target.value)} maxLength={10} className="block w-full border rounded-lg p-2 mt-1" required />
          </label>
          {changedDevice && <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">Mengganti perangkat akan mengakhiri penugasan perangkat sebelumnya dan memulai penugasan baru. Data monitoring dan alert lama tetap tersimpan; pembacaan di dashboard dimulai dari data perangkat baru.</p>}
          {error && <p role="alert" className="text-sm text-red-700 bg-red-50 p-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" disabled={saving} onClick={onClose} className="border rounded-lg px-4 py-2">Batal</button>
            <button type="submit" disabled={saving} className="bg-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
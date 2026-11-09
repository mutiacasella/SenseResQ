import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import {
  getInactiveVolunteers,
  reactivateVolunteer,
  registerVolunteerWithDevice,
} from '../services/management.service';
import type { AvailableVolunteer } from '../services/management.service';

interface Props { onClose: () => void; onCreated: () => Promise<void>; }

export function AddVolunteerModal({ onClose, onCreated }: Props) {
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [device, setDevice] = useState('');
  const [inactive, setInactive] = useState<AvailableVolunteer[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void getInactiveVolunteers().then(setInactive).catch(() => {
      setError('Daftar relawan lama tidak dapat dimuat. Periksa koneksi backend.');
    });
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!id.trim() || !device.trim() || (mode === 'new' && !name.trim())) {
      setError('Isi seluruh kolom yang diperlukan.'); return;
    }
    setSaving(true);
    try {
      if (mode === 'new') await registerVolunteerWithDevice(id.trim(), name.trim(), device.trim());
      else await reactivateVolunteer(id, device.trim());
      await onCreated();
      onClose();
    } catch (err: unknown) {
      const remote = err as { response?: { data?: { message?: string } } };
      setError(remote.response?.data?.message || 'Gagal menyimpan. Periksa ID relawan, perangkat, dan koneksi database.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="add-volunteer-title" className="bg-white rounded-xl w-full max-w-lg p-5 shadow-xl">
        <header className="flex items-center justify-between mb-4">
          <h2 id="add-volunteer-title" className="text-xl font-semibold">Daftarkan Relawan</h2>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Tutup form"><X className="w-5 h-5" /></button>
        </header>
        <div className="flex gap-2 mb-4" role="group" aria-label="Jenis pendaftaran">
          <button type="button" disabled={saving} onClick={() => { setMode('new'); setId(''); setError(''); }} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${mode === 'new' ? 'bg-blue-700 text-white border-blue-700' : 'bg-white'}`}>Relawan baru</button>
          <button type="button" disabled={saving} onClick={() => { setMode('existing'); setId(''); setError(''); }} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${mode === 'existing' ? 'bg-blue-700 text-white border-blue-700' : 'bg-white'}`}>Tugaskan kembali</button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{mode === 'new'
          ? 'Buat identitas relawan dan tentukan perangkat untuk penugasan saat ini.'
          : 'Pilih relawan yang penugasannya telah berakhir, kemudian tentukan perangkat yang akan digunakan.'}</p>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'new' ? <>
            <label className="block text-sm font-medium">ID Relawan
              <input value={id} onChange={(e) => setId(e.target.value)} maxLength={10} placeholder="VOL001" className="block w-full border rounded-lg p-2 mt-1" required />
            </label>
            <label className="block text-sm font-medium">Nama Relawan
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder="Nama lengkap" className="block w-full border rounded-lg p-2 mt-1" required />
            </label>
          </> : <label className="block text-sm font-medium">Pilih Relawan
            <select value={id} onChange={(e) => setId(e.target.value)} className="block w-full border rounded-lg p-2 mt-1" required>
              <option value="">Pilih relawan yang tersedia</option>
              {inactive.map((volunteer) => <option key={volunteer.volunteer_id} value={volunteer.volunteer_id}>{volunteer.name} ({volunteer.volunteer_id})</option>)}
            </select>
            {inactive.length === 0 && <span className="block mt-2 text-xs text-gray-500">Belum ada relawan dengan penugasan yang telah berakhir.</span>}
          </label>}
          <label className="block text-sm font-medium">ID Perangkat
            <input value={device} onChange={(e) => setDevice(e.target.value)} maxLength={10} placeholder="DEV001" className="block w-full border rounded-lg p-2 mt-1" required />
          </label>
          <p className="text-xs text-gray-500">Perangkat harus tidak sedang digunakan pada penugasan lain. ID perangkat baru akan terdaftar otomatis.</p>
          {error && <p role="alert" className="text-sm text-red-700 bg-red-50 rounded p-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" disabled={saving} onClick={onClose} className="border rounded-lg px-4 py-2">Batal</button>
            <button type="submit" disabled={saving || (mode === 'existing' && !inactive.length)} className="bg-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50">{saving ? 'Menyimpan...' : mode === 'existing' ? 'Mulai Penugasan' : 'Simpan'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

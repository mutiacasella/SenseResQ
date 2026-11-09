import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Volunteer } from '../../types/volunteer';
import { archiveVolunteer } from '../services/management.service';

interface Props {
  volunteer: Volunteer;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}

// Mengakhiri penugasan tanpa menghapus identitas atau riwayat pada database
export function DeleteVolunteerModal({ volunteer, onClose, onDeleted }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setSaving(true);
    try {
      await archiveVolunteer(volunteer.volunteer_id);
      await onDeleted();
      onClose();
    } catch (err: unknown) {
      const remote = err as { response?: { data?: { message?: string } } };
      setError(remote.response?.data?.message || 'Gagal mengakhiri penugasan. Periksa koneksi database.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="delete-volunteer-title" aria-describedby="delete-volunteer-description" className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl">
        <header className="flex items-center justify-between mb-4">
          <h2 id="delete-volunteer-title" className="text-lg font-semibold text-gray-900">Akhiri penugasan relawan?</h2>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Tutup konfirmasi" className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </header>
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <p id="delete-volunteer-description" className="text-sm text-amber-900">
            Relawan tidak lagi muncul dalam pemantauan aktif. <strong>Identitas serta riwayat monitoring dan alert tetap tersimpan.</strong> Relawan dan perangkat dapat ditugaskan kembali.
          </p>
        </div>
        <dl className="text-sm bg-gray-50 rounded-lg p-3 grid grid-cols-[100px_1fr] gap-1 mb-4">
          <dt className="text-gray-600">Nama</dt><dd className="font-medium break-words">{volunteer.name}</dd>
          <dt className="text-gray-600">ID Relawan</dt><dd>{volunteer.volunteer_id}</dd>
          <dt className="text-gray-600">ID Perangkat</dt><dd>{volunteer.device_id}</dd>
        </dl>
        {error && <p role="alert" className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" disabled={saving} onClick={onClose} className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-60">Batal</button>
          <button type="button" disabled={saving} onClick={() => void submit()} className="px-4 py-2 rounded-lg bg-red-700 text-white text-sm hover:bg-red-800 disabled:opacity-60">
            {saving ? 'Memproses…' : 'Akhiri Penugasan'}
          </button>
        </div>
      </section>
    </div>
  );
}
# SenseResQ - Dashboard Monitoring Relawan

SenseResQ adalah prototipe dashboard monitoring relawan yang beroperasi secara lokal pada satu laptop Windows. Data wearable diterima melalui receiver USB/Serial, diproses oleh backend Node.js/Express, disimpan di MySQL lokal, dan diperbarui ke frontend React menggunakan Socket.IO.

**Dokumen pengguna:**
- `PANDUAN_SENSERESQ.pdf` - instalasi dan langkah penggunaan dari awal.
- `DESAIN_DASHBOARD_SENSERESQ.pdf` - fungsi, arsitektur, pengelolaan relawan/perangkat, dan batas sistem.

## Penggunaan pada laptop Windows

1. Install Node.js LTS dan MySQL Community Server 8.4 LTS dengan MySQL Configurator. Konfigurasikan Windows Service MySQL agar berjalan otomatis. Gunakan port `3306`.
2. Buat `BackEnd/.env` dari `BackEnd/.env.example`. Masukkan password MySQL pada `DB_PASSWORD`, pastikan `DB_NAME=senseresq`, dan atur `SERIAL_PORT` serta BBOX sesuai perangkat/lokasi.
3. **Cadangkan database** jika sudah mempunyai data penting. Klik dua kali `PERSIAPAN_SEKALI_WINDOWS.bat` saat internet tersedia. Script memasang dependensi, menyiapkan/memigrasikan lima tabel MySQL tanpa `DROP DATABASE`, lalu membangun frontend.
4. Setelah proses bertuliskan `SELESAI`, klik dua kali `START_SENSERESQ_WINDOWS.bat`. Dashboard tersedia pada `http://127.0.0.1:7777`; biarkan jendela server terbuka.
5. Setelah instalasi awal, dashboard dapat beroperasi tanpa internet. Backend dan frontend tidak memerlukan dua terminal yang dijalankan secara manual.

**Konfigurasi rahasia:** berkas `.env` berisi kata sandi dan tidak disertakan di dalam ZIP distribusi. Salin konfigurasi `.env` yang sudah digunakan pada laptop sebelumnya secara pribadi, atau buat dari `.env.example`. Jangan unggah kata sandi ke repositori publik.

## Pengelolaan relawan dan perangkat

- **+ Daftarkan Relawan > Relawan baru**: masukkan ID, nama, dan ID perangkat. Perangkat baru didaftarkan otomatis.
- **Edit (ikon pensil)**: perbaiki nama, atau pilih ID perangkat lain. Jika perangkat berubah, sistem mengakhiri penugasan perangkat sebelumnya dan membuat penugasan baru.
- **Akhiri Penugasan (ikon tempat sampah)**: relawan keluar dari daftar pemantauan aktif; identitas dan riwayat tidak dihapus.
- **+ Daftarkan Relawan > Tugaskan kembali**: pilih relawan yang tidak sedang bertugas, masukkan ID perangkat yang tersedia, lalu mulai penugasan.
- Satu relawan dan satu perangkat hanya dapat memiliki satu penugasan aktif pada waktu yang sama.

## Data dan arsitektur

MySQL berisi lima tabel: `Device`, `Volunteer`, `DeviceAssignment`, `MonitoringData`, dan `Alert`. Identitas relawan dan perangkat tersimpan permanen. Setiap sesi pemakaian dicatat sebagai `assignment_id` pada tabel `DeviceAssignment` dengan waktu mulai/selesai. Data monitoring dan alert dikaitkan dengan penugasan agar riwayat tidak berpindah antarrelawan.

Ketika setup pada database yang sudah berisi data dijalankan, `BackEnd/tools/setupDatabase.js` akan membentuk penugasan historis untuk entri lama yang belum memiliki penugasan, mengaitkan rekaman monitoring/alert lamanya, dan menghapus batasan unik perangkat pada tabel Volunteer. Penugasan baru tidak menghapus catatan lama. **Selalu buat backup sebelum migrasi**, terutama bila basis data pernah diubah secara manual.

Paket yang masuk akan diproses hanya jika ID perangkat sudah terdaftar dan memiliki penugasan aktif. Dalam dashboard, data sensor dari penugasan aktif saja yang menjadi dasar nilai vital dan status koneksi.

## Status koneksi dan monitoring

- **Connected (relawan)**: paket diterima kurang dari 5 detik yang lalu.
- **Lost (relawan)**: tidak ada paket baru selama 5 detik atau lebih.
- **Menunggu data**: belum pernah menerima data dalam penugasan aktif.
- **Receiver USB/Serial Connected**: port receiver terbuka di backend, bukan jaminan tiap wearable menerima koneksi LoRa.
- **Socket.IO terputus**: komunikasi real-time browser dengan backend terganggu.

Status risiko dari tiga tanda vital dan fall detection dihitung dalam `BackEnd/src/utils/healthAssessment.js`. Klasifikasi risiko merupakan aturan prototipe, bukan penilaian klinis tervalidasi.

## Mode simulasi

1. Tutup server, ubah `MOCK_MODE=true` di `BackEnd/.env`, lalu jalankan ulang `START_SENSERESQ_WINDOWS.bat`.
2. Pastikan perangkat yang ingin digunakan mempunyai penugasan aktif.
3. Klik dua kali `DEMO_SENSERESQ_WINDOWS.bat`, masukkan ID perangkat yang terdaftar. Simulator mengirim paket HTTP sekitar setiap 1 detik; kondisi sensor berganti sekitar setiap 5 detik.
4. Untuk kembali ke receiver fisik, hentikan simulator, ubah `MOCK_MODE=false`, lalu jalankan ulang server.

Semua data pada mode simulasi merupakan data buatan. Jangan mengklaimnya sebagai pengukuran wearable asli.

## Pengembangan dan pengujian oleh tim

- Backend mode pengembang: pada folder `BackEnd`, jalankan `npm run dev` atau `npm start`.
- Frontend mode pengembang: pada folder `FrontEnd`, jalankan `npm run dev`. Pada mode distribusi gunakan hasil build frontend dari `PERSIAPAN_SEKALI_WINDOWS.bat`.
- Pengujian logika penugasan (tanpa MySQL): pada folder `BackEnd`, jalankan `node testing/assignmentLogicTest.js`.
- Folder `BackEnd/testing` berisi script lain untuk pengujian; beberapa script lama perlu disesuaikan dengan skema penugasan. Jangan menjalankan pengujian yang menulis atau menghapus data pada database produksi tanpa cadangan.
- `BackEnd/src/ERD SenseResQ.jpg` merupakan aset diagram yang ada di folder kode. Untuk rincian struktur database yang digunakan aplikasi, rujuk `DESAIN_DASHBOARD_SENSERESQ.pdf`.

## Pemecahan masalah

- `Node.js/npm tidak ditemukan`: instal Node.js LTS dan ulangi persiapan.
- `Access denied for user root`: periksa `DB_PASSWORD` di `.env`.
- `ECONNREFUSED ...:3306`: jalankan layanan MySQL pada `services.msc`.
- `EADDRINUSE :7777`: tutup jendela backend SenseResQ yang masih berjalan.
- `no_active_assignment`: pilih atau buat penugasan aktif untuk ID perangkat pengirim.
- `Lost`: periksa selang penerimaan paket dan interval pengiriman wearable.
- Serial `Disconnected`: periksa kabel, COM, baud rate; sambungkan ulang dan restart backend jika perlu.

**Batas keamanan:** aplikasi ini tidak menyediakan autentikasi pengguna dan hanya melayani `127.0.0.1` pada laptop yang sama. Dashboard adalah prototipe pemantauan, bukan alat medis atau sistem keselamatan kritis yang telah tervalidasi.

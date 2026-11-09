# SenseResQ - Dashboard Monitoring Relawan

SenseResQ adalah prototipe dashboard pemantauan relawan yang beroperasi secara lokal pada laptop Windows. Data dari perangkat *wearable* diterima melalui receiver USB/Serial, diproses oleh backend Node.js/Express, disimpan dalam database MySQL lokal, dan ditampilkan secara real-time pada frontend React menggunakan Socket.IO.

**Dokumentasi:**
- `PANDUAN_SENSERESQ.pdf` — panduan instalasi, konfigurasi, dan penggunaan aplikasi.
- `DESAIN_DASHBOARD_SENSERESQ.pdf` — penjelasan fitur, arsitektur, pengelolaan relawan dan perangkat, serta batasan sistem.

## Instalasi dan Penggunaan pada Windows

1. Instal Node.js LTS dan MySQL Community Server 8.4 LTS menggunakan MySQL Configurator. Atur MySQL sebagai Windows Service yang berjalan otomatis dengan port `3306`.
2. Salin `BackEnd/.env.example` menjadi `BackEnd/.env`. Sesuaikan `DB_PASSWORD` dengan konfigurasi MySQL, pastikan `DB_NAME=senseresq`, serta atur `SERIAL_PORT` dan BBOX sesuai perangkat dan lokasi pemantauan.
3. Jika database sebelumnya telah digunakan, lakukan pencadangan data terlebih dahulu. Jalankan `PERSIAPAN_SEKALI_WINDOWS.bat` dengan koneksi internet aktif. Proses ini memasang dependensi, menyiapkan atau memigrasikan lima tabel MySQL tanpa menghapus database, dan membangun frontend.
4. Setelah proses persiapan selesai, jalankan `START_SENSERESQ_WINDOWS.bat`. Dashboard dapat diakses melalui [http://127.0.0.1:7777](http://127.0.0.1:7777). Biarkan jendela server tetap terbuka selama aplikasi digunakan.
5. Setelah instalasi awal, dashboard dapat dijalankan secara lokal tanpa koneksi internet. Backend dan frontend dijalankan melalui satu skrip sehingga tidak memerlukan dua terminal terpisah.

**Konfigurasi:** File `.env` menyimpan pengaturan lokal, termasuk kata sandi database, dan tidak disertakan dalam distribusi proyek. Konfigurasi dapat dibuat menggunakan `.env.example` atau disalin dari instalasi sebelumnya. Informasi sensitif dalam file `.env` tidak boleh disertakan dalam repository publik.

## Pengelolaan Relawan dan Perangkat

SenseResQ menyediakan fitur pengelolaan relawan dan penugasan perangkat sebagai berikut:

- **Daftarkan Relawan → Relawan baru:** mendaftarkan relawan dengan memasukkan ID, nama, dan ID perangkat. Perangkat yang belum terdaftar akan ditambahkan secara otomatis.
- **Edit (ikon pensil):** memperbarui nama relawan atau mengganti perangkat yang digunakan. Pergantian perangkat akan mengakhiri penugasan sebelumnya dan membuat penugasan baru.
- **Akhiri Penugasan (ikon tempat sampah):** mengakhiri penugasan aktif sehingga relawan tidak lagi ditampilkan dalam daftar pemantauan aktif. Identitas dan riwayat pemantauan tetap tersimpan.
- **Daftarkan Relawan → Tugaskan kembali:** mengaktifkan kembali relawan yang telah mengakhiri penugasan dengan memilih perangkat yang tersedia.

Setiap relawan dan perangkat hanya dapat memiliki satu penugasan aktif pada waktu yang sama. Riwayat penugasan sebelumnya tetap tersimpan ketika perangkat diganti atau digunakan kembali.

## Data dan Arsitektur

SenseResQ menggunakan lima tabel utama dalam MySQL:

- `Device` — menyimpan identitas perangkat.
- `Volunteer` — menyimpan identitas relawan.
- `DeviceAssignment` — mencatat hubungan penugasan relawan dan perangkat, termasuk waktu mulai dan berakhirnya penugasan.
- `MonitoringData` — menyimpan hasil pemantauan sensor.
- `Alert` — menyimpan informasi peringatan yang dihasilkan sistem.

Setiap penugasan memiliki `assignment_id` yang digunakan untuk menghubungkan data pemantauan dan peringatan dengan penugasan terkait. Dengan mekanisme ini, riwayat pemantauan tetap dapat dibedakan meskipun perangkat digunakan oleh relawan yang berbeda.

Untuk instalasi dengan database yang sudah memiliki data, `BackEnd/tools/setupDatabase.js` menyediakan mekanisme migrasi. Proses ini membentuk catatan penugasan untuk data lama yang belum memiliki penugasan, menghubungkan riwayat pemantauan dan peringatan, serta menyesuaikan batasan perangkat pada tabel `Volunteer`.

Pencadangan database disarankan sebelum menjalankan migrasi, khususnya jika struktur atau isi database pernah dimodifikasi.

Data dari receiver diproses apabila ID perangkat terdaftar dan memiliki penugasan aktif. Informasi tanda vital dan status koneksi pada dashboard menggunakan data dari penugasan yang sedang berlangsung.

## Status Koneksi dan Monitoring

Dashboard menampilkan beberapa indikator koneksi:

- **Connected:** relawan menerima pembaruan data dalam waktu kurang dari 5 detik.
- **Lost:** tidak terdapat pembaruan data selama 5 detik atau lebih.
- **Menunggu data:** belum terdapat data sensor yang diterima untuk penugasan aktif.
- **Receiver USB/Serial Connected:** port receiver berhasil dibuka oleh backend. Status ini tidak secara langsung menunjukkan konektivitas masing-masing perangkat wearable melalui LoRa.
- **Socket.IO terputus:** komunikasi real-time antara browser dan backend sedang terganggu.

Penilaian status risiko berdasarkan tanda vital dan deteksi jatuh dilakukan melalui `BackEnd/src/utils/healthAssessment.js`. Klasifikasi tersebut menggunakan aturan yang dirancang untuk kebutuhan prototipe dan belum merupakan penilaian klinis yang tervalidasi.

## Mode Simulasi

SenseResQ menyediakan mode simulasi untuk menguji alur penerimaan dan penampilan data tanpa memerlukan perangkat wearable fisik.

1. Hentikan server, kemudian ubah `MOCK_MODE=true` pada `BackEnd/.env`.
2. Jalankan kembali `START_SENSERESQ_WINDOWS.bat`.
3. Pastikan ID perangkat yang akan digunakan memiliki penugasan aktif.
4. Jalankan `DEMO_SENSERESQ_WINDOWS.bat`, lalu masukkan ID perangkat yang telah terdaftar.
5. Simulator akan mengirimkan data melalui HTTP sekitar setiap 1 detik dengan perubahan kondisi sensor sekitar setiap 5 detik.

Untuk kembali menggunakan receiver fisik, hentikan simulator, ubah `MOCK_MODE=false`, kemudian jalankan ulang server.

**Catatan:** Data dalam mode simulasi merupakan data sintetis yang digunakan untuk mendemonstrasikan dan menguji perilaku dashboard, bukan hasil pengukuran perangkat wearable.

## Pengembangan dan Pengujian

Proyek juga mendukung pengembangan dan pengujian komponen secara terpisah.

- **Backend:** jalankan `npm run dev` atau `npm start` dari folder `BackEnd`.
- **Frontend:** jalankan `npm run dev` dari folder `FrontEnd`. Pada penggunaan normal, aplikasi menggunakan hasil build frontend yang dibuat melalui `PERSIAPAN_SEKALI_WINDOWS.bat`.
- **Pengujian logika penugasan:** jalankan `node testing/assignmentLogicTest.js` dari folder `BackEnd`. Pengujian ini tidak memerlukan koneksi MySQL.
- **Pengujian tambahan:** tersedia dalam folder `BackEnd/testing`. Beberapa skrip pengujian lama menggunakan struktur database sebelumnya sehingga mungkin memerlukan penyesuaian. Pengujian yang mengubah data sebaiknya dilakukan menggunakan database khusus pengujian.

File `BackEnd/src/ERD SenseResQ.jpg` merupakan aset diagram database dalam proyek. Penjelasan arsitektur dan struktur data terbaru tersedia dalam `DESAIN_DASHBOARD_SENSERESQ.pdf`.

## Pemecahan Masalah

| Permasalahan | Penanganan |
|---|---|
| `Node.js/npm tidak ditemukan` | Pastikan Node.js LTS telah terinstal, kemudian jalankan kembali proses persiapan. |
| `Access denied for user root` | Periksa `DB_PASSWORD` pada file `.env`. |
| `ECONNREFUSED ...:3306` | Periksa layanan MySQL melalui `services.msc` dan pastikan layanan berjalan. |
| `EADDRINUSE :7777` | Pastikan tidak ada proses backend SenseResQ lain yang masih menggunakan port `7777`. |
| `no_active_assignment` | Pastikan ID perangkat pengirim memiliki penugasan aktif. |
| Status `Lost` | Periksa koneksi perangkat, penerimaan paket, dan interval pengiriman data. |
| Serial `Disconnected` | Periksa koneksi USB, nomor port COM, dan baud rate. Sambungkan kembali receiver dan jalankan ulang backend jika diperlukan. |

## Batasan Sistem

SenseResQ dikembangkan sebagai prototipe dashboard pemantauan relawan dan dijalankan secara lokal melalui `127.0.0.1`. Sistem belum menyediakan autentikasi pengguna maupun akses pemantauan melalui jaringan eksternal.

Status risiko dan peringatan yang ditampilkan merupakan hasil pemrosesan berdasarkan aturan prototipe. Sistem belum divalidasi sebagai perangkat medis atau sistem keselamatan kritis.
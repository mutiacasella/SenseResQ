# SenseResQ - Posko Monitoring Dashboard

**SenseResQ** adalah aplikasi web dashboard monitoring relawan bencana yang berjalan secara offline di Laptop Posko (tanpa internet/cloud). Sistem ini berfungsi untuk membaca data sensor dari hardware wearable via USB Serial, menyimpannya ke database MySQL, serta menampilkan data kesehatan, *fall detection*, dan posisi relawan secara *real-time* ke interface posko.

![picture 0](https://i.imgur.com/DmdlQZa.png)  
![picture 1](https://i.imgur.com/OmQLNTa.png)  


## Tech Stack

### Backend

| Kategori | Teknologi |
|----------|-----------|
| Runtime & Framework | Node.js, Express.js |
| Database | MySQL |
| Real-time Communication | Socket.io |
| Hardware Interface | Custom USB Serial Service |
| Dev Tools | Nodemon, Dotenv |

### Frontend

| Kategori | Teknologi |
|----------|-----------|
| Framework & Build Tool | React, TypeScript, Vite |
| Styling | Tailwind CSS, Radix UI, Lucide React |
| Data Visualization & Charts | Recharts |
| HTTP Client & Real-time | Axios, Socket.io-Client |


## Alur Integrasi Data

1. **Hardware Ingestion:** Hardware Receiver ESP32 mengirimkan paket data sensor relawan melalui USB Serial ke Laptop Posko.
2. **Backend Processing (`BackEnd`):**
* `serialService.js` membaca dan melakukan *parsing* data serial.
* Data diproses oleh modul terkait, lalu disimpan ke database MySQL.
* `socket.js` memancarkan (*broadcast*) update data terbaru via **Socket.io**.
3. **Frontend Rendering (`FrontEnd`):**
* **Initial Load:** React memanggil REST API (Axios) untuk mengunduh data histori awal dari MySQL.
* **Live Monitoring:** Component UI melakukan *listening* ke WebSocket untuk pembaruan *real-time*.

## Panduan Menjalankan Aplikasi

### Prasyarat

* Node.js versi terbaru
* Server MySQL aktif (sudah di-import file `schema.sql`)
* Receiver ESP32 terhubung ke port USB Laptop Posko

### 1. Setup & Jalankan Backend

```bash
# Masuk ke folder BackEnd
cd Dashboard\ Monitoring/BackEnd

# Install dependensi
npm install

# Buat file .env dan sesuaikan konfigurasi berikut:
# PORT=7777
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=senseresq_db

# Jalankan server backend (dengan nodemon)
npm run start

```

### 2. Setup & Jalankan Frontend

```bash
# Buka terminal baru, masuk ke folder FrontEnd
cd Dashboard\ Monitoring/FrontEnd

# Install dependensi
npm install

# Jalankan frontend server lokal (Vite)
npm run dev

```

Akses dashboard melalui browser di `http://localhost:5173` (atau port yang ditampilkan Vite).


## Catatan Teknis Development

* **Offline-First:** Seluruh dependensi UI dan backend berjalan lokal di Laptop Posko tanpa memerlukan koneksi internet.
* **Handling Multi-Component:** Pembagian *state management* dan interface TypeScript pada frontend diletakkan dalam folder `src/types/` (`alert.ts`, `vital-sign.ts`, `volunteer.ts`) untuk memastikan konsistensi struktur data yang diterima dari backend.
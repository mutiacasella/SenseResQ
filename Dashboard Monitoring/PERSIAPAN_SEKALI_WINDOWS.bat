@echo off
setlocal
cd /d "%~dp0"
title SenseResQ - Persiapan Awal
where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js belum terpasang. Unduh Node.js LTS dari nodejs.org.
  pause
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm belum ditemukan. Instal Node.js LTS termasuk npm.
  pause
  exit /b 1
)
if not exist "BackEnd\.env" (
  echo ERROR: Salin BackEnd\.env.example menjadi BackEnd\.env, lalu isi password MySQL.
  pause
  exit /b 1
)
echo [1/4] Memasang dependensi backend (butuh internet pertama kali)...
pushd BackEnd
call npm ci
if errorlevel 1 goto failed
echo [2/4] Menyiapkan database dan riwayat penugasan lokal MySQL...
echo CATATAN: Untuk database berisi data penting, buat cadangan sebelum migrasi.
node tools\setupDatabase.js
if errorlevel 1 goto failed
popd
echo [3/4] Memasang dependensi frontend (butuh internet pertama kali)...
pushd FrontEnd
call npm ci
if errorlevel 1 goto failed
echo [4/4] Membuat aplikasi frontend untuk mode offline...
call npm run build
if errorlevel 1 goto failed
popd
echo.
echo SELESAI. Mulai sekarang gunakan START_SENSERESQ_WINDOWS.bat.
echo Komputer dan MySQL harus tetap menyala saat pemantauan.
pause
exit /b 0
:failed
echo.
echo PERSIAPAN GAGAL. Periksa baris ERROR di atas.
echo Jangan lanjut ke launcher sampai tahap ini berhasil.
popd
pause
exit /b 1

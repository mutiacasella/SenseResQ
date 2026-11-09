@echo off
setlocal
cd /d "%~dp0"
title SenseResQ - Buka Dashboard
where node >nul 2>&1
if errorlevel 1 goto not_ready
if not exist "BackEnd\node_modules\mysql2" goto not_ready
if not exist "FrontEnd\dist\index.html" goto not_ready
if not exist "BackEnd\.env" goto not_ready
REM Satu klik: satu backend Express melayani API, Socket.IO, dan frontend build.
REM Jendela server sengaja tetap terbuka agar pesan gangguan mudah dibaca.
start "SenseResQ - Server Lokal" /D "%~dp0BackEnd" cmd /k "node src\index.js"
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:7777"
exit /b 0
:not_ready
echo SenseResQ belum siap. Ikuti PANDUAN_SENSERESQ.pdf.
echo Jalankan PERSIAPAN_SEKALI_WINDOWS.bat setelah konfigurasi awal.
pause
exit /b 1

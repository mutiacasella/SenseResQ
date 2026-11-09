@echo off
setlocal
cd /d "%~dp0"
echo ---------------------------------------------------------------
echo MODE DEMO: data SIMULASI, bukan hasil wearable yang nyata.
echo Pastikan BackEnd\.env berisi MOCK_MODE=true, lalu restart server.
echo Daftarkan relawan beserta perangkat DEV001 melalui dashboard.
echo ---------------------------------------------------------------
set /p DEVICE=ID perangkat demo [DEV001]:
if "%DEVICE%"=="" set DEVICE=DEV001
cd BackEnd
node tools\demoSender.js "%DEVICE%"
pause

// Status receiver serial, tidak disimpulkan dari aktivitas perangkat wearable
let status = 'disconnected';
const setSerialStatus = (value) => { status = value; };
const getSerialStatus = () => ({ status, port: process.env.SERIAL_PORT || 'COM3' });
module.exports = { setSerialStatus, getSerialStatus };
const express = require('express');
const router = express.Router();
const monitoringController = require('./monitoring.controller');

// Untuk kepentingan pengembangan
router.post('/monitoring', monitoringController.createMonitoringData);
router.get('/monitoring/latest', monitoringController.getLatestMonitoringData);
router.get('/monitoring/history/:device_id', monitoringController.getMonitoringHistory);

module.exports = router;
const express = require('express');
const router = express.Router();
const alertController = require('./alert.controller');

// Endpoint
router.get('/alert', alertController.getAllAlerts);

// Untuk kepentingan pengembangan
router.get('/alert/:id', alertController.getAlertById);

module.exports = router;
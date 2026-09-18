const express = require("express");
const router = express.Router();
const deviceController = require("./device.controller");

// Untuk kepentingan pengembangan
router.post("/device", deviceController.createDevice);
router.get("/device", deviceController.getAllDevices);
router.get("/device/:id", deviceController.getDeviceById);
router.delete("/device/:id", deviceController.deleteDevice);

module.exports = router;
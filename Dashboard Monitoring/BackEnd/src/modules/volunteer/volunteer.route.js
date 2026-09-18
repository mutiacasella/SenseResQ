const express = require('express');
const router = express.Router();
const volunteerController = require('./volunteer.controller');

// Untuk kepentingan pengembangan
router.post("/volunteer", volunteerController.createVolunteer);
router.get("/volunteer", volunteerController.getAllVolunteers);
router.get("/volunteer/:id", volunteerController.getVolunteerById);
router.put("/volunteer/:id", volunteerController.updateVolunteer);
router.delete("/volunteer/:id", volunteerController.deleteVolunteer);

// Endpoint
router.get("/dashboard/volunteers", volunteerController.getDashboardVolunteers);

module.exports = router;
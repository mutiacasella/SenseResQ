const volunteerRepository = require("./volunteer.repository");
const { calculateFatigueScore, getSeverity, } = require("../../utils/healthAssessment");

// Menambahkan data relawan baru
const createVolunteer = async (req, res) => {
    try {
        await volunteerRepository.createVolunteer(req.body);

        return res.status(201).json({
            success: true,
            message: "Volunteer created successfully",
        });
    } 
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Mengambil seluruh data relawan
const getAllVolunteers = async (req, res) => {
    try {
        const volunteers = await volunteerRepository.getAllVolunteers();

        return res.status(200).json({
            success: true,
            message: "Volunteers retrieved successfully",
            data: volunteers,
        });
    } 
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Mengambil satu data relawan berdasarkan id
const getVolunteerById = async (req, res) => {
    try {
        const { id } = req.params;
        const volunteer = await volunteerRepository.getVolunteerById(id);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Volunteer retrieved successfully",
            data: volunteer,
        });
    } 
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Mengambil data relawan yang ditampilkan dashboard
const getDashboardVolunteers = async (req, res) => {
    try {
        const volunteers = await volunteerRepository.getDashboardVolunteers();

        // Melakukan mapping untuk menambahkan perhitungan ke setiap relawan
        const dashboardVolunteers = volunteers.map((volunteer) => {
            
            // Menghitung skor kelelahan dari data vital
            const fatigue_score = calculateFatigueScore(
                volunteer.heart_rate,
                volunteer.temperature,
                volunteer.spo2
            );

            // Menentukan status berdasarkan skor kelelahan dan deteksi jatuh
            const status = getSeverity(
                fatigue_score,
                volunteer.fall_detected
            );

            // Menghitung selisih waktu terakhir update
            const now = new Date();
            const lastUpdate = new Date(volunteer.timestamp);

            const diffSeconds = (now - lastUpdate) / 1000;

            // Menentukan status koneksi
            const connection_status =
                diffSeconds <= 15 ? "Connected" : "Lost";

            return {
                ...volunteer,
                fatigue_score,
                status,
                connection_status,
            };
        });

        return res.status(200).json({
            success: true,
            message: "Dashboard volunteers retrieved successfully",
            data: dashboardVolunteers,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Memperbarui data relawan berdasarkan id
const updateVolunteer = async (req, res) => {
    try {
        const { id } = req.params;
        const volunteer = await volunteerRepository.getVolunteerById(id);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found",
            });
        }

        await volunteerRepository.updateVolunteer(id, req.body);

        return res.status(200).json({
            success: true,
            message: "Volunteer updated successfully",
        });
    } 
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Menghapus satu data relawan berdasarkan id
const deleteVolunteer = async (req, res) => {
    try {
        const { id } = req.params;
        const volunteer = await volunteerRepository.getVolunteerById(id);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found",
            });
        }

        await volunteerRepository.deleteVolunteer(id);

        return res.status(200).json({
            success: true,
            message: "Volunteer deleted successfully",
        });
    } 
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getAllVolunteers,
    getVolunteerById,
    getDashboardVolunteers,
    createVolunteer,
    updateVolunteer,
    deleteVolunteer,
};
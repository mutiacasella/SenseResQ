const alertRepository = require("./alert.repository");

// Mengambil seluruh data peringatan
const getAllAlerts = async (req, res) => {
    try {
        const alerts = await alertRepository.getAllAlerts();

        return res.status(200).json({
            success: true,
            message: "Alerts retrieved successfully",
            data: alerts,
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

// Mengambil satu data peringatan berdasarkan id
const getAlertById = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await alertRepository.getAlertById(id);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Alert retrieved successfully",
            data: alert,
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
    getAllAlerts,
    getAlertById,
};
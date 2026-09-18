const deviceRepository = require("./device.repository");

// Menambahkan data perangkat baru
const createDevice = async (req, res) => {
    try {
        const { device_id } = req.body;
        await deviceRepository.createDevice(device_id);

        return res.status(201).json({
            success: true,
            message: "Device created successfully",
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

// Mengambil seluruh data perangkat
const getAllDevices = async (req, res) => {
    try {
        const devices = await deviceRepository.getAllDevices();

        return res.status(200).json({
            success: true,
            message: "Devices retrieved successfully",
            data: devices,
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

// Mengambil satu data perangkat berdasarkan id
const getDeviceById = async (req, res) => {
    try {
        const { id } = req.params;
        const device = await deviceRepository.getDeviceById(id);

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Device retrieved successfully",
            data: device,
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

// Menghapus satu data perangkat berdasarkan id
const deleteDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const device = await deviceRepository.getDeviceById(id);

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device not found",
            });
        }

        await deviceRepository.deleteDevice(id);

        return res.status(200).json({
            success: true,
            message: "Device deleted successfully",
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
    getAllDevices,
    getDeviceById,
    createDevice,
    deleteDevice,
};
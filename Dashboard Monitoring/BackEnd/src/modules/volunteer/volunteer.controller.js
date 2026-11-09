
const volunteerRepository = require("./volunteer.repository");
const { calculateFatigueScore, getSeverity, } = require("../../utils/healthAssessment");

// Membuat identitas relawan dan penugasan perangkat secara atomik
const createVolunteer = async (req, res) => {
    try {
        const { volunteer_id, name, device_id } = req.body ?? {};
        if (![volunteer_id, device_id].every((id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,10}$/.test(id))
            || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 50) {
            return res.status(400).json({ success: false, message: 'Periksa ID relawan, nama, dan ID perangkat.' });
        }
        if (await volunteerRepository.getVolunteerById(volunteer_id)) {
            return res.status(409).json({ success: false, message: 'ID relawan sudah terdaftar. Pilih Tugaskan Kembali untuk relawan lama.' });
        }
        await volunteerRepository.createVolunteer({ volunteer_id, name: name.trim(), device_id });
        return res.status(201).json({ success: true, message: 'Relawan dan penugasan berhasil dibuat.' });
    } catch (error) {
        console.error(error);
        return res.status(error.status || (error.code === 'ER_DUP_ENTRY' ? 409 : 500)).json({
            success: false,
            message: error.status ? error.message : error.code === 'ER_DUP_ENTRY'
                ? 'ID relawan atau penugasan perangkat sedang digunakan.' : 'Gagal menambahkan relawan.',
        });
    }
};

// Relawan tanpa penugasan aktif dapat dipilih kembali dari formulir pendaftaran
const getInactiveVolunteers = async (req, res) => {
    try {
        const data = await volunteerRepository.getInactiveVolunteers();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Gagal mengambil daftar relawan.' });
    }
};

const activateVolunteer = async (req, res) => {
    try {
        const { id } = req.params;
        const { device_id } = req.body ?? {};
        if (typeof device_id !== 'string' || !/^[A-Za-z0-9_-]{1,10}$/.test(device_id)) {
            return res.status(400).json({ success: false, message: 'ID perangkat tidak valid.' });
        }
        await volunteerRepository.activateVolunteer(id, device_id);
        return res.status(200).json({ success: true, message: 'Penugasan relawan berhasil dimulai.' });
    } catch (error) {
        console.error(error);
        return res.status(error.status || (error.code === 'ER_DUP_ENTRY' ? 409 : 500)).json({
            success: false,
            message: error.status ? error.message : error.code === 'ER_DUP_ENTRY'
                ? 'Relawan atau perangkat sedang memiliki penugasan aktif.' : 'Gagal menugaskan kembali relawan.',
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

        const dashboardVolunteers = volunteers.map((volunteer) => {
            const hasData = volunteer.timestamp !== null && volunteer.timestamp !== undefined;
            const fatigue_score = hasData
                ? calculateFatigueScore(volunteer.heart_rate, volunteer.temperature, volunteer.spo2)
                : null;
            const status = hasData
                ? getSeverity(fatigue_score, volunteer.fall_detected)
                : 'No Data';
            const last_received_age_ms = hasData
                ? Math.max(0, Date.now() - new Date(volunteer.timestamp).getTime())
                : null;
            const connection_status = !hasData
                ? 'Awaiting Data'
                : (Number.isFinite(last_received_age_ms) && last_received_age_ms < 5000)
                    ? 'Connected'
                    : 'Lost';
            return { ...volunteer, fatigue_score, status, connection_status, last_received_age_ms };
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

// Mengubah nama dan, bila diperlukan, membuat penugasan perangkat baru
const updateVolunteer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, device_id } = req.body ?? {};
        if (typeof name !== 'string' || !name.trim() || name.trim().length > 50
            || typeof device_id !== 'string' || !/^[A-Za-z0-9_-]{1,10}$/.test(device_id)) {
            return res.status(400).json({ success: false, message: 'Nama atau ID perangkat tidak valid.' });
        }
        await volunteerRepository.updateVolunteer(id, { name: name.trim(), device_id });
        return res.status(200).json({ success: true, message: 'Data relawan dan penugasan berhasil diperbarui.' });
    } catch (error) {
        console.error(error);
        return res.status(error.status || (error.code === 'ER_DUP_ENTRY' ? 409 : 500)).json({
            success: false,
            message: error.status ? error.message : error.code === 'ER_DUP_ENTRY'
                ? 'Relawan atau perangkat sedang memiliki penugasan aktif.' : 'Gagal memperbarui data relawan.',
        });
    }
};

// Menghapus satu data relawan berdasarkan id
const deleteVolunteer = async (req, res) => {
    try {
        const { id } = req.params;
        const volunteer = await volunteerRepository.getVolunteerById(id);

        if (!volunteer || !volunteer.is_active) {
            return res.status(404).json({
                success: false,
                message: "Relawan tidak ditemukan pada daftar aktif.",
            });
        }

        await volunteerRepository.deleteVolunteer(id);

        return res.status(200).json({
            success: true,
            message: "Penugasan selesai. Identitas relawan dan riwayat tetap tersimpan.",
        });
    }
    catch (error) {
        console.error(error);

        return res.status(error.status || 500).json({
            success: false,
            message: error.status ? error.message : 'Gagal mengakhiri penugasan.',
        });
    }
};

module.exports = {
    getAllVolunteers,
    getInactiveVolunteers,
    activateVolunteer,
    getVolunteerById,
    getDashboardVolunteers,
    createVolunteer,
    updateVolunteer,
    deleteVolunteer,
};
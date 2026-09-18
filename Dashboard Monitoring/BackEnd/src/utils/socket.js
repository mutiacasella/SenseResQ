let io;

// Menginisialisasi instance Socket.IO agar dapat digunakan secara global
const initSocket = (socketIo) => {
    io = socketIo;
};

// Mendapatkan instance Socket.IO yang telah diinisialisasi
const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized.");
    }

    return io;
};

module.exports = {
    initSocket,
    getIO,
};
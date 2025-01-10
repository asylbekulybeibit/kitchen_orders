"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const database_1 = require("./config/database");
const orderRoutes_1 = require("./routes/orderRoutes");
// Инициализация Express приложения
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Настройка CORS
app.use((0, cors_1.default)());
// Настройка парсинга JSON
app.use(express_1.default.json({ limit: '10mb' }));
// Настройка Socket.IO
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT"]
    }
});
// WebSocket подключения
exports.io.on('connection', (socket) => {
    console.log('👤 Новое WebSocket подключение:', socket.id);
    socket.on('disconnect', () => {
        console.log('👤 WebSocket отключен:', socket.id);
    });
    socket.on('error', (error) => {
        console.error('❌ Ошибка WebSocket:', error);
    });
    // Подтверждение подключения
    socket.emit('connected', { message: 'Успешное подключение к серверу' });
});
// Отслеживание всех WebSocket событий
exports.io.engine.on('connection_error', (err) => {
    console.error('❌ Ошибка подключения WebSocket:', err);
});
// Подключение маршрутов
app.use('/api', orderRoutes_1.orderRoutes);
// Обработка 404
app.use((req, res) => {
    console.log('404 - Маршрут не найден:', req.url);
    res.status(404).json({ message: 'Маршрут не найден' });
});
// Глобальная обработка ошибок
app.use((err, req, res, next) => {
    console.error('Глобальная ошибка:', err);
    res.status(500).json({ message: 'Внутренняя ошибка сервера', error: err.message });
});
// Запуск сервера
const PORT = process.env.PORT || 3000;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Подключение к MongoDB
        yield (0, database_1.connectDB)();
        // Запуск HTTP сервера
        httpServer.listen(PORT, () => {
            console.log(`✅ Сервер запущен на порту ${PORT}`);
            console.log(`✅ WebSocket сервер готов к подключениям`);
            console.log(`✅ API доступно по адресу http://localhost:${PORT}/api`);
        });
        // Обработка ошибок сервера
        httpServer.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Порт ${PORT} уже используется`);
                process.exit(1);
            }
            else {
                console.error('❌ Ошибка сервера:', error);
            }
        });
    }
    catch (error) {
        console.error('❌ Ошибка при запуске сервера:', error);
        process.exit(1);
    }
});
// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
    console.error('❌ Необработанное исключение:', error);
    process.exit(1);
});
process.on('unhandledRejection', (error) => {
    console.error('❌ Необработанное отклонение промиса:', error);
    process.exit(1);
});
startServer();

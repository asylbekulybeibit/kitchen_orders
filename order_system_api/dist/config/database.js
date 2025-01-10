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
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kitchen_orders';
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Попытка подключения к MongoDB:', MONGODB_URI);
        yield mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ MongoDB успешно подключена');
        // Проверяем существование коллекции
        const db = mongoose_1.default.connection.db;
        if (!db) {
            throw new Error('База данных не инициализирована');
        }
        const collections = yield db.listCollections().toArray();
        console.log('Существующие коллекции:', collections.map(c => c.name));
        if (!collections.find(c => c.name === 'orders')) {
            console.log('Создаем коллекцию orders...');
            yield db.createCollection('orders');
            console.log('Коллекция orders успешно создана');
        }
    }
    catch (error) {
        console.error('❌ Ошибка подключения к MongoDB:', error);
        process.exit(1);
    }
});
exports.connectDB = connectDB;
mongoose_1.default.connection.on('disconnected', () => {
    console.log('🔌 MongoDB отключена');
});
mongoose_1.default.connection.on('error', (err) => {
    console.error('❌ Ошибка MongoDB:', err);
});

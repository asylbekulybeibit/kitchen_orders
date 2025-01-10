"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.posterConfig = void 0;
exports.validatePosterSignature = validatePosterSignature;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.posterConfig = {
    applicationId: process.env.POSTER_APPLICATION_ID || '',
    applicationSecret: process.env.POSTER_APPLICATION_SECRET || '',
    accountName: process.env.POSTER_ACCOUNT_NAME || '',
    accessToken: process.env.POSTER_ACCESS_TOKEN || ''
};
// Функция для проверки подписи от Poster
function validatePosterSignature(req) {
    const signature = req.headers['x-poster-signature'];
    if (!signature)
        return false;
    // В реальном приложении здесь должна быть проверка подписи
    // с использованием applicationSecret
    return true;
}

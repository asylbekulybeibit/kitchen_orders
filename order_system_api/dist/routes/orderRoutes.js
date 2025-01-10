"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = void 0;
const express_1 = __importDefault(require("express"));
const OrderController_1 = require("../controllers/OrderController");
const router = express_1.default.Router();
exports.orderRoutes = router;
// Маршруты для заказов
router.get('/orders', (req, res) => {
    OrderController_1.OrderController.getActiveOrders(req, res);
});
router.get('/orders/active', (req, res) => {
    OrderController_1.OrderController.getActiveOrders(req, res);
});
router.get('/orders/archive', (req, res) => {
    OrderController_1.OrderController.getArchivedOrders(req, res);
});
router.post('/orders', (req, res) => {
    OrderController_1.OrderController.createOrder(req, res);
});
router.put('/orders/:orderId/status', (req, res) => {
    OrderController_1.OrderController.updateItemStatus(req, res);
});
router.put('/orders/:orderId/print', (req, res) => {
    OrderController_1.OrderController.updateItemPrintStatus(req, res);
});
// Обработка ошибок маршрутов
router.use((err, req, res, next) => {
    console.error('Ошибка в маршрутах:', err);
    res.status(500).json({ message: 'Ошибка при обработке запроса', error: err.message });
});

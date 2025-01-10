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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const Order_1 = require("../models/Order");
const app_1 = require("../app");
const interfaces_1 = require("../models/interfaces");
const poster_1 = require("../config/poster");
class OrderController {
    // Получить все активные заказы
    static getActiveOrders(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Получение активных заказов...');
                const orders = yield Order_1.Order.find({ isArchived: false })
                    .sort({ createdAt: -1 });
                console.log('Найдено активных заказов:', orders.length);
                res.json(orders);
            }
            catch (error) {
                console.error('Ошибка при получении заказов:', error);
                res.status(500).json({ message: 'Ошибка при получении заказов', error });
            }
        });
    }
    // Получить архив заказов
    static getArchivedOrders(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Получение архивных заказов...');
                const orders = yield Order_1.Order.find({ isArchived: true })
                    .sort({ createdAt: -1 });
                console.log('Найдено архивных заказов:', orders.length);
                res.json(orders);
            }
            catch (error) {
                console.error('Ошибка при получении архива:', error);
                res.status(500).json({ message: 'Ошибка при получении архива заказов', error });
            }
        });
    }
    // Создать новый заказ (принимает данные от Poster CRM)
    static createOrder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                console.log('\n=== Начало обработки заказа от Poster ===');
                console.log('Заголовки запроса:', JSON.stringify(req.headers, null, 2));
                console.log('Тело запроса:', JSON.stringify(req.body, null, 2));
                // Проверяем access token
                const accessToken = req.headers['access-token'];
                if (accessToken && accessToken !== poster_1.posterConfig.accessToken) {
                    console.error('❌ Неверный access token');
                    return res.status(401).json({ message: 'Неверный access token' });
                }
                // Получаем данные заказа из Poster
                const incoming_order = req.body;
                console.log('ID заказа из Poster:', incoming_order.incoming_order_id || incoming_order.order_id);
                // Преобразуем формат данных Poster в наш формат
                const orderData = {
                    orderId: incoming_order.incoming_order_id ||
                        ((_a = incoming_order.order_id) === null || _a === void 0 ? void 0 : _a.toString()) ||
                        `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    items: (incoming_order.products || []).map((product) => ({
                        name: product.product_name,
                        quantity: parseInt(product.count) || 1,
                        price: parseFloat(product.price) || 0,
                        status: interfaces_1.OrderItemStatus.NEW,
                        printed: false
                    })),
                    totalAmount: parseFloat(incoming_order.sum) || 0,
                    isArchived: false,
                    createdAt: new Date(incoming_order.created_at || Date.now())
                };
                console.log('Преобразованные данные заказа:', JSON.stringify(orderData, null, 2));
                const order = new Order_1.Order(orderData);
                console.log('Создан объект заказа:', order);
                const savedOrder = yield order.save();
                console.log('✅ Заказ успешно сохранен в MongoDB:', savedOrder._id);
                // Отправляем уведомление через WebSocket
                console.log('Отправка WebSocket уведомления о новом заказе:', savedOrder.orderId);
                app_1.io.emit('newOrder', savedOrder);
                console.log('WebSocket уведомление отправлено');
                console.log('=== Завершение обработки заказа ===\n');
                res.status(201).json(savedOrder);
            }
            catch (error) {
                console.error('❌ Ошибка при создании заказа:', error);
                res.status(400).json({ message: 'Ошибка при создании заказа', error });
            }
        });
    }
    // Обновить статус позиции заказа
    static updateItemStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId } = req.params;
                const { itemId, status } = req.body;
                console.log(`Обновление статуса позиции ${itemId} заказа ${orderId} на ${status}`);
                const order = yield Order_1.Order.findOne({ orderId });
                if (!order) {
                    console.log('Заказ не найден:', orderId);
                    return res.status(404).json({ message: 'Заказ не найден' });
                }
                const item = order.items.find(item => item._id && item._id.toString() === itemId);
                if (!item) {
                    console.log('Позиция не найдена:', itemId);
                    return res.status(404).json({ message: 'Позиция не найдена' });
                }
                // Обновляем статус позиции
                item.status = status;
                console.log('Статус позиции обновлен на:', status);
                // Проверяем, все ли позиции выполнены
                if (status === interfaces_1.OrderItemStatus.DONE) {
                    console.log('Проверяем статусы всех позиций...');
                    const allItemsDone = order.items.every(item => item.status === interfaces_1.OrderItemStatus.DONE);
                    console.log('Все позиции выполнены?', allItemsDone);
                    if (allItemsDone) {
                        console.log('Все позиции выполнены, перемещаем заказ в архив');
                        order.isArchived = true;
                    }
                }
                yield order.save();
                console.log('Заказ сохранен. isArchived:', order.isArchived);
                // Отправляем уведомление через WebSocket
                console.log('Отправка WebSocket уведомления об обновлении заказа:', order.orderId);
                app_1.io.emit('orderUpdated', order);
                console.log('WebSocket уведомление отправлено');
                res.json(order);
            }
            catch (error) {
                console.error('Ошибка при обновлении статуса:', error);
                res.status(500).json({ message: 'Ошибка при обновлении статуса', error });
            }
        });
    }
    // Обновить статус печати позиции
    static updateItemPrintStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId } = req.params;
                const { itemId } = req.body;
                const order = yield Order_1.Order.findOne({ orderId });
                if (!order) {
                    return res.status(404).json({ message: 'Заказ не найден' });
                }
                const item = order.items.find(item => item._id && item._id.toString() === itemId);
                if (!item) {
                    return res.status(404).json({ message: 'Позиция не найдена' });
                }
                item.printed = true;
                yield order.save();
                // Отправляем уведомление через WebSocket
                console.log('Отправка WebSocket уведомления об обновлении печати:', order.orderId);
                app_1.io.emit('orderUpdated', order);
                console.log('WebSocket уведомление отправлено');
                res.json(order);
            }
            catch (error) {
                console.error('Ошибка при обновлении статуса печати:', error);
                res.status(500).json({ message: 'Ошибка при обновлении статуса печати', error });
            }
        });
    }
}
exports.OrderController = OrderController;

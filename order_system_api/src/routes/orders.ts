import express from 'express';
import { OrderController } from '../controllers/OrderController';

const router = express.Router();

// Получение заказов
router.get('/active', OrderController.getActiveOrders);
router.get('/archived', OrderController.getArchivedOrders);

// Создание заказа
router.post('/', OrderController.createOrder);

// Обновление статусов
router.put('/:orderId/unit-status', OrderController.updateUnitStatus);
router.put('/:orderId/unit-print', OrderController.updateUnitPrintStatus);
router.put('/:orderId/archive', OrderController.archiveOrder);

export default router; 
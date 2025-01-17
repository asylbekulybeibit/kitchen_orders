import { Router } from 'express';
import { PosterService } from '../services/poster.service';
import { ReceiptService } from '../services/receipt.service';
import { Order } from '../models/order.model';
import { WebSocketService } from '../services/websocket.service';

const router = Router();
const posterService = new PosterService();
const receiptService = new ReceiptService();
const wsService = WebSocketService.getInstance();

// Обработчик вебхуков от Poster
router.post('/poster', async (req, res) => {
  try {
    console.log('Received webhook from Poster:', JSON.stringify(req.body, null, 2));

    // Проверяем account из вебхука
    const account = req.body.account;
    if (account !== process.env.POSTER_ACCOUNT) {
      console.error('Invalid account in webhook:', account);
      return res.status(200).json({ success: false, error: 'Invalid account' });
    }

    // Проверяем наличие необходимых полей
    if (!req.body.object_id || !req.body.object_type || !req.body.action) {
      console.error('Invalid webhook data:', req.body);
      return res.status(200).json({ success: false, error: 'Invalid webhook data' });
    }

    const { object_id, object_type, action } = req.body;

    // Обрабатываем только заказы
    if (object_type !== 'order') {
      console.log('Ignoring non-order webhook:', object_type);
      return res.status(200).json({ success: true });
    }

    // Получаем данные заказа из Poster
    const order = await posterService.getOrder(object_id);

    switch (action) {
      case 'added':
        // Генерируем чеки для всех продуктов
        const receipts = await receiptService.generateReceiptsForOrder(order);
        
        // Сохраняем заказ в базу данных
        const savedOrder = await Order.create({
          ...order,
          receipts,
          status: 'new'
        });

        // Отправляем уведомление через WebSocket
        wsService.notifyNewOrder(savedOrder);
        break;

      case 'changed':
        // Проверяем существование заказа
        const existingOrder = await Order.findOne({ order_id: object_id });
        if (!existingOrder) {
          console.error('Order not found for update:', object_id);
          return res.status(200).json({ success: false, error: 'Order not found' });
        }

        // Обновляем статус заказа если он изменился
        if (order.status !== existingOrder.status) {
          await Order.updateOne(
            { order_id: object_id },
            { $set: { status: order.status } }
          );

          // Отправляем уведомление об изменении статуса
          wsService.notifyOrderStatusChanged(object_id, order.status);
        }
        break;

      case 'removed':
        // Помечаем заказ как удаленный
        await Order.updateOne(
          { order_id: object_id },
          { $set: { status: 'deleted' } }
        );

        // Отправляем уведомление об удалении
        wsService.notifyOrderRemoved(object_id);
        break;

      default:
        console.log('Ignoring unknown action:', action);
    }

    // Всегда отвечаем успехом, чтобы Poster не повторял вебхук
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Даже при ошибке отвечаем успехом
    res.status(200).json({ success: true });
  }
});

export default router; 
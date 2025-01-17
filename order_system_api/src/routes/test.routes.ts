import { Router } from 'express';
import { posterService } from '../services/poster.service';
import { Order } from '../models/Order';
import { receiptService } from '../services/receipt.service';
import { emitNewOrder } from '../services/websocket.service';

const router = Router();

// Создание тестовых заказов
router.post('/generate-orders', async (req, res) => {
  try {
    const count = req.body.count || 20;
    const orders = [];

    for (let i = 0; i < count; i++) {
      // Получаем тестовый заказ из сервиса
      const orderData = await posterService.simulateOrder();
      
      // Генерируем чеки для продуктов
      const productsWithReceipts = await receiptService.generateReceiptsForOrder(
        orderData.order_id,
        orderData.products
      );

      // Создаем заказ в базе
      const order = new Order({
        ...orderData,
        products: productsWithReceipts
      });
      await order.save();

      // Отправляем уведомление через WebSocket
      emitNewOrder(order);
      
      orders.push(order);

      // Добавляем небольшую задержку между заказами
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    res.json({ 
      success: true, 
      message: `Generated ${orders.length} test orders`,
      orders: orders.map(o => o.order_id)
    });
  } catch (error) {
    console.error('Error generating test orders:', error);
    res.status(500).json({ error: 'Failed to generate test orders' });
  }
});

export const testRouter = router; 
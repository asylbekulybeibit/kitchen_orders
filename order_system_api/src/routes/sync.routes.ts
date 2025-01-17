import { Router } from 'express';
import { posterService } from '../services/poster.service';
import { Order } from '../models/Order';
import { receiptService } from '../services/receipt.service';
import { emitNewOrder } from '../services/websocket.service';

const router = Router();

// Синхронизация всего меню
router.post('/menu', async (req, res) => {
  console.log('Received sync menu request');
  try {
    console.log('Starting menu synchronization...');
    const result = await posterService.syncAll();
    console.log('Sync completed successfully:', result);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Sync error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    res.status(500).json({ error: 'Failed to sync menu', details: error.message });
  }
});

// Тестовый вебхук для создания заказа
router.post('/test-webhook', async (req, res) => {
  console.log('Received test webhook request');
  try {
    // Генерируем тестовый заказ
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

    res.json({ 
      success: true, 
      message: 'Test order created',
      order 
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Failed to create test order' });
  }
});

export const syncRouter = router; 
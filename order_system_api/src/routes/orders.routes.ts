import { Router } from 'express';
import { Order } from '../models/Order';
import { receiptService } from '../services/receipt.service';
import { emitOrderUpdate } from '../services/websocket.service';

const router = Router();

// Получение активных заказов
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: 'archived' } }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Получение архивных заказов
router.get('/archived', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'archived' }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get archived orders' });
  }
});

// Получение заказа по ID
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ order_id: req.params.orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// Обновление статуса продукта в заказе
router.patch('/:orderId/products/:productId/status', async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { status, unitIndex } = req.body;

    const order = await Order.findOne({ order_id: orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const product = order.products.find(p => p.product_id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found in order' });
    }

    // Проверяем допустимые значения статуса
    const validStatuses = ['new', 'cooking', 'ready', 'served'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Инициализируем массив units, если его нет
    if (!product.units) {
      product.units = Array(product.count).fill({ status: 'new' });
    }

    // Обновляем статус конкретной единицы
    product.units[unitIndex] = { 
      ...product.units[unitIndex],
      status 
    };

    // Проверяем, все ли единицы всех продуктов готовы
    const allUnitsReady = order.products.every(p => 
      p.units?.every(unit => unit?.status === 'ready')
    );

    // Если все единицы готовы, помечаем заказ как архивный
    if (allUnitsReady) {
      order.status = 'archived';
    }

    await order.save();
    emitOrderUpdate(order);

    res.json(order);
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ error: 'Failed to update product status' });
  }
});

export const ordersRouter = router; 
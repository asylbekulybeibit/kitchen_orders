import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { OrderItemStatus, IOrderItem } from '../models/interfaces';
import { io } from '../app';
import mongoose from 'mongoose';

export class PosterWebhookController {
  static async handleWebhook(req: Request, res: Response) {
    try {
      console.log('\n=== Получен вебхук от Poster ===');
      console.log('Тело запроса:', JSON.stringify(req.body, null, 2));

      const data = req.body;
      const order = new Order();

      // Заполняем основные данные заказа
      order.orderId = data.incoming_order_id || 
                     data.order_id?.toString() || 
                     `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      order.totalAmount = parseFloat(data.sum) || 0;
      order.isArchived = false;
      order.createdAt = new Date(data.created_at || Date.now());

      // Преобразуем товары
      order.items = await this.transformProducts(data.products || []);

      console.log('Преобразованный заказ:', JSON.stringify(order, null, 2));

      // Сохраняем заказ
      const savedOrder = await order.save();
      console.log('Заказ сохранен в БД:', savedOrder._id);

      // Отправляем уведомление через WebSocket
      io.emit('newOrder', savedOrder);
      console.log('WebSocket уведомление отправлено');

      res.status(201).json(savedOrder);
    } catch (error) {
      console.error('Ошибка при обработке вебхука:', error);
      res.status(500).json({ message: 'Ошибка при обработке вебхука', error });
    }
  }

  private static async transformProducts(products: any[]): Promise<IOrderItem[]> {
    return products.map(product => {
      const quantity = parseInt(product.count) || 1;
      
      // Создаем units для каждой единицы товара
      const units = Array(quantity).fill(null).map((_, index) => ({
        id: `${new mongoose.Types.ObjectId()}-${index + 1}`,
        status: OrderItemStatus.NEW,
        printed: false
      }));

      return {
        name: product.product_name,
        quantity,
        price: parseFloat(product.price) || 0,
        units
      };
    });
  }
} 
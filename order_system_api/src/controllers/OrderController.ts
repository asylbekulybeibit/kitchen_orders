import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { io } from '../app';
import { OrderItemStatus } from '../models/interfaces';
import mongoose from 'mongoose';

export class OrderController {
  // Получить все активные заказы
  static async getActiveOrders(req: Request, res: Response) {
    try {
      console.log('Получение активных заказов...');
      const orders = await Order.find({ isArchived: false })
        .sort({ createdAt: -1 });
      console.log('Найдено активных заказов:', orders.length);
      res.json(orders);
    } catch (error) {
      console.error('Ошибка при получении заказов:', error);
      res.status(500).json({ message: 'Ошибка при получении заказов', error });
    }
  }

  // Получить архив заказов
  static async getArchivedOrders(req: Request, res: Response) {
    try {
      console.log('Получение архивных заказов...');
      const orders = await Order.find({ isArchived: true })
        .sort({ createdAt: -1 });
      console.log('Найдено архивных заказов:', orders.length);
      res.json(orders);
    } catch (error) {
      console.error('Ошибка при получении архива:', error);
      res.status(500).json({ message: 'Ошибка при получении архива заказов', error });
    }
  }

  // Создать новый заказ
  static async createOrder(req: Request, res: Response) {
    try {
      const orderData = req.body;
      
      // Преобразуем каждую позицию, создавая units
      orderData.items = orderData.items.map((item: any) => ({
        ...item,
        units: Array(item.quantity).fill(null).map(() => ({
          status: OrderItemStatus.NEW,
          printed: false
        }))
      }));

      const order = new Order(orderData);
      const savedOrder = await order.save();
      
      io.emit('newOrder', savedOrder);
      res.status(201).json(savedOrder);
    } catch (error) {
      console.error('Ошибка при создании заказа:', error);
      res.status(400).json({ message: 'Ошибка при создании заказа', error });
    }
  }

  // Обновить статус единицы товара
  static async updateUnitStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const { itemId, unitIndex } = req.body;
      console.log(`Обновление статуса единицы ${unitIndex} позиции ${itemId} заказа ${orderId}`);

      const order = await Order.findById(orderId);
      if (!order) {
        console.log('Заказ не найден:', orderId);
        return res.status(404).json({ message: 'Заказ не найден' });
      }

      const item = order.items.find(item => 
        item._id && item._id.toString() === itemId
      );
      if (!item) {
        console.log('Позиция не найдена:', itemId);
        return res.status(404).json({ message: 'Позиция не найдена' });
      }

      if (unitIndex >= item.units.length) {
        console.log('Единица товара не найдена:', unitIndex);
        return res.status(404).json({ message: 'Единица товара не найдена' });
      }

      const unit = item.units[unitIndex];
      // Обновляем статус единицы
      if (unit.status === OrderItemStatus.NEW) {
        unit.status = OrderItemStatus.IN_PROGRESS;
      } else if (unit.status === OrderItemStatus.IN_PROGRESS) {
        unit.status = OrderItemStatus.DONE;
      }
      
      console.log('Статус единицы обновлен на:', unit.status);

      // Проверяем, все ли единицы всех позиций выполнены
      const allUnitsCompleted = order.items.every(item => 
        item.units.every(unit => unit.status === OrderItemStatus.DONE)
      );

      if (allUnitsCompleted) {
        console.log('Все единицы выполнены, архивируем заказ');
        order.isArchived = true;
      }

      await order.save();
      console.log('Заказ сохранен. isArchived:', order.isArchived);
      
      io.emit('orderUpdated', order);
      res.json(order);
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
      res.status(500).json({ message: 'Ошибка при обновлении статуса', error });
    }
  }

  // Обновить статус печати единицы
  static async updateUnitPrintStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const { itemId, unitIndex } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Заказ не найден' });
      }

      const item = order.items.find(item => 
        item._id && item._id.toString() === itemId
      );
      if (!item) {
        return res.status(404).json({ message: 'Позиция не найдена' });
      }

      if (unitIndex >= item.units.length) {
        return res.status(404).json({ message: 'Единица товара не найдена' });
      }

      const unit = item.units[unitIndex];
      unit.printed = true;
      await order.save();
      
      io.emit('orderUpdated', order);
      res.json(order);
    } catch (error) {
      console.error('Ошибка при обновлении статуса печати:', error);
      res.status(500).json({ message: 'Ошибка при обновлении статуса печати', error });
    }
  }

  // Архивировать заказ
  static async archiveOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Заказ не найден' });
      }

      order.isArchived = true;
      await order.save();

      io.emit('orderUpdated', order);
      res.json(order);
    } catch (error) {
      console.error('Ошибка при архивации заказа:', error);
      res.status(500).json({ message: 'Ошибка при архивации заказа', error });
    }
  }
} 
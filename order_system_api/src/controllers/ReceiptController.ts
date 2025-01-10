import { Request, Response } from 'express';
import { Order } from '../models/Order';
import * as fs from 'fs';
import * as path from 'path';

export class ReceiptController {
  static async generateReceipt(req: Request, res: Response) {
    try {
      const { orderId, itemId, unitIndex } = req.body;

      // Получаем заказ из базы
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Заказ не найден' });
      }

      // Находим нужный item
      const item = order.items.find(item => item?._id?.toString() === itemId);
      if (!item || !item._id) {
        return res.status(404).json({ message: 'Товар не найден' });
      }

      // Генерируем HTML чека
      const receiptHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Чек #${order.orderId}-${unitIndex + 1}</title>
          <style>
            @page {
              size: 40mm 60mm;
              margin: 0;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 5px;
              font-size: 12px;
              width: 40mm;
              height: 60mm;
              box-sizing: border-box;
            }
            .receipt { 
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 2px;
              box-sizing: border-box;
            }
            .header { 
              text-align: center; 
              margin-bottom: 5px;
              border-bottom: 1px dashed #000;
              padding-bottom: 3px;
            }
            .content {
              margin: 5px 0;
              line-height: 1.2;
            }
            .footer { 
              text-align: center; 
              margin-top: 5px;
              border-top: 1px dashed #000;
              padding-top: 3px;
              font-style: italic;
              font-size: 10px;
            }
            .order-info {
              margin: 3px 0;
            }
            .timestamp {
              font-size: 10px;
              color: #666;
              text-align: center;
              margin: 3px 0;
            }
            p {
              margin: 2px 0;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">              
              <div class="order-info">
              <p>Чек</p>  
              <p>Тапсырыс #${order.orderId}</p>                
              </div>
            </div>
            
            <div class="content">
              <p><strong>Тамақ аты:</strong><br>${item.name}</p>
            </div>

            <div class="timestamp">
              Дайындалған уақыты: ${new Date().toLocaleString("ru-RU", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>

            <div class="footer">
              <p>Рахмет!</p>
              <p>Ас болсын ❤️</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Создаем директорию для чеков, если её нет
      const receiptsDir = path.join(process.cwd(), 'receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      // Генерируем уникальное имя файла
      const fileName = `receipt_${order.orderId}_${itemId}_${unitIndex}_${Date.now()}.html`;
      const filePath = path.join(receiptsDir, fileName);

      // Сохраняем файл
      fs.writeFileSync(filePath, receiptHtml);

      // Формируем URL для доступа к чеку
      const receiptUrl = `http://localhost:3000/receipts/${fileName}`;

      res.json({
        success: true,
        receiptUrl,
        message: 'Чек успешно сгенерирован'
      });
    } catch (error) {
      console.error('Ошибка при генерации чека:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при генерации чека',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 
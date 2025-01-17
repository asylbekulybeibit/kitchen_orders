import fs from 'fs';
import path from 'path';
import { IOrderProduct, Order } from '../models/Order';

interface OrderModification {
  name: string;
}

interface OrderIngredient {
  name: string;
  removed?: boolean;
}

class ReceiptService {
  private RECEIPTS_DIR = path.join(__dirname, '../../public/receipts');

  constructor() {
    if (!fs.existsSync(this.RECEIPTS_DIR)) {
      fs.mkdirSync(this.RECEIPTS_DIR, { recursive: true });
    }
  }

  private getReceiptFileName(orderId: string, productId: string, unitIndex: number): string {
    // Используем хеш от параметров продукта для создания уникального имени
    const hash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify({
        product_id: productId,
        unit: unitIndex
      }))
      .digest('hex')
      .substring(0, 8);

    return `${productId}_${hash}.html`;
  }

  private getReceiptUrl(fileName: string): string {
    return `/receipts/${fileName}`;
  }

  private async findExistingReceipt(product: IOrderProduct): Promise<string | null> {
    try {
      // Ищем заказ с таким же продуктом и параметрами
      const existingOrder = await Order.findOne({
        'products': {
          $elemMatch: {
            product_id: product.product_id,
            product_name: product.product_name,
            'modifications.name': product.modifications?.map((m: OrderModification) => m.name) || [],
            'ingredients.name': product.ingredients?.map((i: OrderIngredient) => i.name) || [],
            'ingredients.removed': product.ingredients?.map((i: OrderIngredient) => i.removed || false) || [],
            'units.receipt_url': { $exists: true }
          }
        }
      }).sort({ created_at: -1 }); // Берем самый свежий заказ

      if (existingOrder) {
        const existingProduct = existingOrder.products.find(p => 
          p.product_id === product.product_id &&
          p.product_name === product.product_name &&
          JSON.stringify(p.modifications?.map((m: OrderModification) => m.name)) === 
            JSON.stringify(product.modifications?.map((m: OrderModification) => m.name)) &&
          JSON.stringify(p.ingredients?.map((i: OrderIngredient) => ({ name: i.name, removed: i.removed }))) === 
            JSON.stringify(product.ingredients?.map((i: OrderIngredient) => ({ name: i.name, removed: i.removed })))
        );

        if (existingProduct?.units?.[0]?.receipt_url) {
          // Проверяем, существует ли файл чека
          const filePath = path.join(this.RECEIPTS_DIR, path.basename(existingProduct.units[0].receipt_url));
          if (fs.existsSync(filePath)) {
            return existingProduct.units[0].receipt_url;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding existing receipt:', error);
      return null;
    }
  }

  async generateReceipt(orderId: string, product: IOrderProduct, unitIndex: number): Promise<string> {
    // Сначала проверяем, есть ли уже такой чек в других заказах
    const existingReceiptUrl = await this.findExistingReceipt(product);
    if (existingReceiptUrl) {
      console.log(`Using existing receipt: ${existingReceiptUrl}`);
      return existingReceiptUrl;
    }

    // Если нет, генерируем новый чек
    const fileName = this.getReceiptFileName(orderId, product.product_id, unitIndex);
    const filePath = path.join(this.RECEIPTS_DIR, fileName);
    const receiptUrl = this.getReceiptUrl(fileName);

    // Если файл уже существует, используем его
    if (fs.existsSync(filePath)) {
      console.log(`Using existing receipt file: ${receiptUrl}`);
      return receiptUrl;
    }

    console.log(`Generating new receipt: ${receiptUrl}`);

    // Генерируем HTML чека
    const html = this.generateReceiptHtml(product, unitIndex);

    // Сохраняем чек
    await fs.promises.writeFile(filePath, html, 'utf8');

    return receiptUrl;
  }

  async generateReceiptsForOrder(orderId: string, products: IOrderProduct[]): Promise<IOrderProduct[]> {
    console.log(`Generating receipts for order ${orderId}`);
    
    const updatedProducts = await Promise.all(
      products.map(async (product) => {
        const units = await Promise.all(
          Array.from({ length: product.count }, async (_, index) => {
            const receipt_url = await this.generateReceipt(orderId, product, index);
            return { status: 'new', receipt_url };
          })
        );
        return { ...product, units };
      })
    );

    return updatedProducts;
  }

  private generateReceiptHtml(product: IOrderProduct, unitIndex: number): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Чек</title>
          <style>
            body { 
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              font-size: 14px;
            }
            .receipt { 
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .product { 
              margin-bottom: 15px;
            }
            .product h2 {
              margin: 0 0 10px 0;
              font-size: 18px;
              text-align: center;
              padding-bottom: 10px;
              border-bottom: 1px dashed #ccc;
            }
            .modifications { 
              margin: 10px 0;
            }
            .modifications h3 {
              margin: 5px 0;
              font-size: 16px;
            }
            .modifications ul {
              margin: 5px 0;
              padding-left: 20px;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="product">
              <h2>${product.product_name.split(' (')[0]}</h2>
              ${product.modifications?.length ? `
                <div class="modifications">
                  <h3>Модификации:</h3>
                  <ul>
                    ${product.modifications.map((mod: OrderModification) => `<li>${mod.name}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              ${product.ingredients?.length ? `
                <div class="modifications">
                  <h3>Ингредиенты:</h3>
                  <ul>
                    ${product.ingredients.map((ing: OrderIngredient) => `<li>${ing.name}${ing.removed ? ' (убрать)' : ''}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const receiptService = new ReceiptService(); 
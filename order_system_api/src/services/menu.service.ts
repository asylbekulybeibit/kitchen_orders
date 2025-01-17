import { posterService } from './poster.service';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { emitMenuUpdate } from './websocket.service';

class MenuService {
  // Синхронизация всего меню
  async syncMenu() {
    try {
      await this.syncCategories();
      await this.syncProducts();
      emitMenuUpdate();
      return { success: true, message: 'Menu synchronized successfully' };
    } catch (error) {
      console.error('Error syncing menu:', error);
      throw error;
    }
  }

  // Синхронизация категорий
  private async syncCategories() {
    try {
      const categories = await posterService.syncCategories();
      console.log('Categories synchronized successfully');
      return categories;
    } catch (error) {
      console.error('Error syncing categories:', error);
      throw error;
    }
  }

  // Синхронизация продуктов
  private async syncProducts() {
    try {
      const products = await posterService.syncProducts();
      console.log('Products synchronized successfully');
      return products;
    } catch (error) {
      console.error('Error syncing products:', error);
      throw error;
    }
  }

  // Получение всех категорий
  async getCategories() {
    return Category.find().sort({ sort_order: 1 });
  }

  // Получение всех продуктов
  async getProducts() {
    return Product.find().sort({ sort_order: 1 });
  }

  // Получение продуктов по категории
  async getProductsByCategory(categoryId: string) {
    return Product.find({ menu_category_id: categoryId }).sort({ sort_order: 1 });
  }

  // Получение продукта по ID
  async getProductById(productId: string) {
    return Product.findOne({ product_id: productId });
  }
}

export const menuService = new MenuService(); 
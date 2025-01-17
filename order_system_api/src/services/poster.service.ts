import axios from 'axios';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import dotenv from 'dotenv';

dotenv.config();

interface IModificationGroup {
  name: string;
  modifications: Array<{
    modificator_id: string;
    name: string;
  }>;
}

interface IProduct {
  product_id: string;
  product_name: string;
  category_name?: string;
  product_price?: string;
  group_modifications?: IModificationGroup[];
  ingredients?: Array<{
    ingredient_name: string;
    ingredient_unit?: string;
    ingredient_weight?: number;
  }>;
}

interface ITestOrderProduct {
  product_id: string;
  product_name: string;
  count: number;
  category_name: string;
  product_price?: string;
  modifications: Array<{
    mod_id: string;
    name: string;
    group_name: string;
  }>;
  ingredients: Array<{
    name: string;
    unit?: string;
    weight?: number;
    removed?: boolean;
    extra?: boolean;
  }>;
  units: Array<{
    status: string;
    comment?: string;
  }>;
}

interface ITestOrder {
  order_id: string;
  spot_id: string;
  table_id: string;
  table_name: string;
  client_id: null;
  client_name: null;
  sum: number;
  discount: number;
  total_sum: number;
  status: string;
  created_at: Date;
  products: ITestOrderProduct[];
}

class PosterService {
  private readonly token = process.env.POSTER_ACCESS_TOKEN;
  private readonly baseUrl = `https://${process.env.POSTER_ACCOUNT}.joinposter.com/api`;

  private async fetchFromPoster(endpoint: string, params: Record<string, any> = {}) {
    try {
      const queryParams = new URLSearchParams({
        token: this.token!,
        ...params
      }).toString();

      const url = `${this.baseUrl}/${endpoint}?${queryParams}`;
      console.log('Fetching from Poster URL:', url.replace(this.token!, '[HIDDEN]'));
      
      const response = await axios.get(url);
      console.log('Poster API response status:', response.status);
      
      if (!response.data.response) {
        console.error('No response data from Poster API:', response.data);
        throw new Error('Invalid response from Poster API');
      }
      
      return response.data.response;
    } catch (error: any) {
      console.error(`Error fetching from Poster: ${endpoint}`);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async getOrder(orderId: string) {
    try {
      const order = await this.fetchFromPoster('orders.getById', { order_id: orderId });
      return this.transformPosterOrder(order);
    } catch (error) {
      console.error('Error getting order from Poster:', error);
      throw error;
    }
  }

  private transformPosterOrder(posterOrder: any) {
    try {
      // Проверяем наличие необходимых полей
      if (!posterOrder.order_id || !posterOrder.products) {
        throw new Error('Invalid order data from Poster');
      }

      return {
        order_id: posterOrder.order_id.toString(),
        table_id: posterOrder.table_id?.toString() || 'Нет стола',
        spot_id: posterOrder.spot_id?.toString(),
        created_at: new Date(posterOrder.date_start * 1000), // Конвертируем unix timestamp в Date
        status: 'new',
        products: posterOrder.products.map(this.transformPosterProduct)
      };
    } catch (error) {
      console.error('Error transforming Poster order:', error);
      throw error;
    }
  }

  private transformPosterProduct(posterProduct: any) {
    try {
      if (!posterProduct.product_id || !posterProduct.product_name) {
        throw new Error('Invalid product data from Poster');
      }

      return {
        product_id: posterProduct.product_id.toString(),
        product_name: posterProduct.product_name,
        count: parseInt(posterProduct.count) || 1,
        modifications: posterProduct.modifications?.map((mod: any) => ({
          mod_id: mod.modification_id?.toString(),
          name: mod.modification_name,
          group_name: mod.modification_group_name || 'Модификации'
        })) || [],
        ingredients: posterProduct.ingredients?.map((ing: any) => ({
          name: ing.ingredient_name,
          removed: Boolean(ing.removed),
          extra: Boolean(ing.extra)
        })) || []
      };
    } catch (error) {
      console.error('Error transforming Poster product:', error);
      throw error;
    }
  }

  async syncCategories() {
    try {
      console.log('Syncing categories...');
      const categories = await this.fetchFromPoster('menu.getCategories');
      
      // Очищаем существующие категории
      await Category.deleteMany({});
      
      // Преобразуем и сохраняем категории
      const transformedCategories = categories.map((cat: any) => ({
        category_id: cat.category_id.toString(),
        name: cat.category_name,
        parent_category: cat.parent_category?.toString(),
        visible: Boolean(cat.visible),
        sort_order: parseInt(cat.sort_order) || 0,
        // Сохраняем все дополнительные поля
        _poster_data: cat
      }));

      const savedCategories = await Category.insertMany(transformedCategories);
      console.log(`Synced ${savedCategories.length} categories`);
      return savedCategories;
    } catch (error) {
      console.error('Error syncing categories:', error);
      throw error;
    }
  }

  async syncProducts() {
    try {
      console.log('Syncing products...');
      const products = await this.fetchFromPoster('menu.getProducts');
      
      // Очищаем существующие продукты
      await Product.deleteMany({});
      
      // Преобразуем и сохраняем продукты
      const transformedProducts = products.map((product: any) => ({
        product_id: product.product_id.toString(),
        category_id: product.category_id?.toString(),
        name: product.product_name,
        price: parseFloat(product.price) || 0,
        visible: Boolean(product.visible),
        sort_order: parseInt(product.sort_order) || 0,
        modificator_groups: product.group_modifications?.map((group: any) => ({
          name: group.name,
          modificators: group.modifications?.map((mod: any) => ({
            modificator_id: mod.modificator_id.toString(),
            name: mod.name
          })) || []
        })) || [],
        ingredients: product.ingredients?.map((ing: any) => ({
          ingredient_id: ing.ingredient_id.toString(),
          name: ing.ingredient_name,
          unit: ing.ingredient_unit,
          weight: parseFloat(ing.ingredient_weight) || 0
        })) || [],
        // Сохраняем все дополнительные поля
        _poster_data: product
      }));

      const savedProducts = await Product.insertMany(transformedProducts);
      console.log(`Synced ${savedProducts.length} products`);
      return savedProducts;
    } catch (error) {
      console.error('Error syncing products:', error);
      throw error;
    }
  }
}

export const posterService = new PosterService(); 
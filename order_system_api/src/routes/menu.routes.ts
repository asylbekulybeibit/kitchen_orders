import { Router } from 'express';
import { menuService } from '../services/menu.service';

const router = Router();

// Синхронизация меню с Poster
router.post('/sync', async (req, res) => {
  try {
    const result = await menuService.syncMenu();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync menu' });
  }
});

// Получение всех категорий
router.get('/categories', async (req, res) => {
  try {
    const categories = await menuService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Получение всех продуктов
router.get('/products', async (req, res) => {
  try {
    const products = await menuService.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Получение продуктов по категории
router.get('/categories/:categoryId/products', async (req, res) => {
  try {
    const products = await menuService.getProductsByCategory(req.params.categoryId);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get products by category' });
  }
});

// Получение продукта по ID
router.get('/products/:productId', async (req, res) => {
  try {
    const product = await menuService.getProductById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get product' });
  }
});

export const menuRouter = router; 
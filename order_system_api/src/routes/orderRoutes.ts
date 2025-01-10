import express, { Request, Response } from 'express';
import { OrderController } from '../controllers/OrderController';
import { PosterWebhookController } from '../controllers/PosterWebhookController';

const router = express.Router();

// Маршруты для заказов
router.get('/orders', (req: Request, res: Response) => {
  OrderController.getActiveOrders(req, res);
});

router.get('/orders/active', (req: Request, res: Response) => {
  OrderController.getActiveOrders(req, res);
});

router.get('/orders/archive', (req: Request, res: Response) => {
  OrderController.getArchivedOrders(req, res);
});

router.post('/orders', (req: Request, res: Response) => {
  OrderController.createOrder(req, res);
});

router.put('/orders/:orderId/status', (req: Request, res: Response) => {
  OrderController.updateUnitStatus(req, res);
});

router.put('/orders/:orderId/print', (req: Request, res: Response) => {
  OrderController.updateUnitPrintStatus(req, res);
});

// Вебхуки от Poster
router.post('/poster/webhook', (req: Request, res: Response) => {
  PosterWebhookController.handleWebhook(req, res);
});

// Обработка ошибок маршрутов
router.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Ошибка в маршрутах:', err);
  res.status(500).json({ message: 'Ошибка при обработке запроса', error: err.message });
});

export { router as orderRoutes }; 
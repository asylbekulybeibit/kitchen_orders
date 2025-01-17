import { Router } from 'express';
import { menuRouter } from './menu.routes';
import { ordersRouter } from './orders.routes';

const router = Router();

// Регистрация маршрутов
router.use('/menu', menuRouter);
router.use('/orders', ordersRouter);

export const apiRouter = router; 
import express from 'express';
import { ReceiptController } from '../controllers/ReceiptController';

const router = express.Router();

router.post('/generate', ReceiptController.generateReceipt);

export default router; 
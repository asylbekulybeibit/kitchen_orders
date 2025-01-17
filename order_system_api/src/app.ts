import express from 'express';
import cors from 'cors';
import { ordersRouter } from './routes/orders.routes';
import { webhookRouter } from './routes/webhook.routes';
import { syncRouter } from './routes/sync.routes';
import { connectDB } from './config/database';
import { setupWebSocket } from './services/websocket.service';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { testRouter } from './routes/test.routes';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/orders', ordersRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/sync', syncRouter);
app.use('/api/test', testRouter);

// Connect to MongoDB
connectDB();

// Setup WebSocket
setupWebSocket(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
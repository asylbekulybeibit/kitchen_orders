import { Server as WebSocketServer } from 'ws';
import { Server } from 'http';

export class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocketServer;

  private constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();
  }

  public static initialize(server: Server): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService(server);
    }
    return WebSocketService.instance;
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      throw new Error('WebSocketService must be initialized with a server first');
    }
    return WebSocketService.instance;
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket connection established');

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  }

  private broadcast(data: any): void {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(data));
        } catch (error) {
          console.error('Error broadcasting message:', error);
        }
      }
    });
  }

  public notifyNewOrder(order: any): void {
    this.broadcast({
      type: 'new_order',
      data: order
    });
  }

  public notifyOrderStatusChanged(orderId: string, newStatus: string): void {
    this.broadcast({
      type: 'order_status_changed',
      data: {
        order_id: orderId,
        status: newStatus
      }
    });
  }

  public notifyOrderRemoved(orderId: string): void {
    this.broadcast({
      type: 'order_removed',
      data: {
        order_id: orderId
      }
    });
  }
} 
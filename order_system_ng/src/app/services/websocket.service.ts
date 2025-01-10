import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket;
  messages: Observable<Order>;

  constructor() {
    this.socket = io('http://localhost:3000');
    
    this.messages = new Observable<Order>((observer) => {
      this.socket.on('orderUpdated', (order: Order) => {
        observer.next(order);
      });

      this.socket.on('newOrder', (order: Order) => {
        observer.next(order);
      });

      return () => {
        this.socket.disconnect();
      };
    });
  }
} 
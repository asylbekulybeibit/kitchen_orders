import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { Order } from '@app/interfaces/order.interface';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.socketConfig.url, environment.socketConfig.options);
  }

  fromEvent<T>(eventName: string): Observable<T> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data) => {
        subscriber.next(data);
      });
    });
  }

  onNewOrder(): Observable<Order> {
    return this.fromEvent<Order>('newOrder');
  }

  onOrderUpdate(): Observable<Order> {
    return this.fromEvent<Order>('orderUpdate');
  }
}

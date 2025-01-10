import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl + '/orders';
  private printerServerUrl = 'http://localhost:3001/print'; // URL принтер-сервера

  constructor(private http: HttpClient) {}

  getActiveOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/active`);
  }

  getArchivedOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/archived`);
  }

  updateItemStatus(orderId: string, itemId: string, unitIndex: number): Observable<Order> {
    return this.http.put<Order>(
      `${this.apiUrl}/${orderId}/unit-status`,
      { itemId, unitIndex }
    );
  }

  // Генерация чека
  generateReceipt(orderId: string, itemId: string, unitIndex: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/receipts/generate`, {
      orderId,
      itemId,
      unitIndex
    });
  }

  // Отправка URL чека на принтер-сервер
  sendToPrinter(receiptUrl: string): Observable<any> {
    return this.http.post(this.printerServerUrl, { url: receiptUrl });
  }

  updateItemPrintStatus(orderId: string, itemId: string, unitIndex: number): Observable<Order> {
    return this.http.put<Order>(
      `${this.apiUrl}/${orderId}/unit-print`,
      { itemId, unitIndex }
    );
  }

  archiveOrder(orderId: string): Observable<Order> {
    return this.http.put<Order>(
      `${this.apiUrl}/${orderId}/archive`,
      {}
    );
  }
} 
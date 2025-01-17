import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Order } from '@app/interfaces/order.interface';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getActiveOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  getArchivedOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/archived`);
  }

  updateProductStatus(orderId: string, productId: string, unitIndex: number, status: 'new' | 'cooking' | 'ready'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/orders/${orderId}/products/${productId}/status`, {
      status,
      unitIndex
    });
  }

  syncMenu(): Observable<any> {
    console.log('Syncing menu with Poster...');
    return this.http.post(`${this.apiUrl}/sync/menu`, {});
  }
} 
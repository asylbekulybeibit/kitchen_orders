import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OrderCardComponent } from '../order-card/order-card.component';
import { OrderService } from '../../services/order.service';
import { WebSocketService } from '../../services/websocket.service';
import { Order } from '../../models/order.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-kitchen-display',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    OrderCardComponent
  ],
  templateUrl: './kitchen-display.component.html',
  styleUrls: ['./kitchen-display.component.scss']
})
export class KitchenDisplayComponent implements OnInit, OnDestroy {
  activeOrders: Order[] = [];
  archivedOrders: Order[] = [];
  showArchive: boolean = false;
  private wsSubscription?: Subscription;

  constructor(
    private orderService: OrderService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  setDisplayMode(showArchive: boolean): void {
    this.showArchive = showArchive;
  }

  onOrderArchived(archivedOrder: Order): void {
    this.activeOrders = this.activeOrders.filter(order => order._id !== archivedOrder._id);
    
    if (!this.archivedOrders.some(order => order._id === archivedOrder._id)) {
      this.archivedOrders.unshift(archivedOrder);
    }
  }

  private loadOrders(): void {
    this.orderService.getActiveOrders().subscribe({
      next: (orders) => {
        this.activeOrders = orders;
      },
      error: (error) => {
        console.error('Ошибка при загрузке активных заказов:', error);
      }
    });

    this.orderService.getArchivedOrders().subscribe({
      next: (orders) => {
        this.archivedOrders = orders;
      },
      error: (error) => {
        console.error('Ошибка при загрузке архива заказов:', error);
      }
    });
  }

  private setupWebSocket(): void {
    this.wsSubscription = this.wsService.messages.subscribe({
      next: (order: Order) => {
        if (order.isArchived) {
          this.handleArchivedOrder(order);
        } else {
          this.handleActiveOrder(order);
        }
      },
      error: (error: any) => {
        console.error('Ошибка WebSocket:', error);
      }
    });
  }

  private handleActiveOrder(order: Order): void {
    const index = this.activeOrders.findIndex(o => o._id === order._id);
    if (index !== -1) {
      this.activeOrders[index] = order;
    } else {
      this.activeOrders.unshift(order);
    }
  }

  private handleArchivedOrder(order: Order): void {
    const activeIndex = this.activeOrders.findIndex(o => o._id === order._id);
    if (activeIndex !== -1) {
      this.activeOrders.splice(activeIndex, 1);
    }

    const archivedIndex = this.archivedOrders.findIndex(o => o._id === order._id);
    if (archivedIndex !== -1) {
      this.archivedOrders[archivedIndex] = order;
    } else {
      this.archivedOrders.unshift(order);
    }
  }
} 
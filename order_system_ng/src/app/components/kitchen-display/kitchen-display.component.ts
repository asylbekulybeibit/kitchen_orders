import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { OrdersService } from '@app/services/orders.service';
import { PrinterService } from '@app/services/printer.service';
import { SocketService } from '@app/services/socket.service';
import { Order, OrderProduct, ProductUnit, PrintRequest } from '@app/interfaces/order.interface';
import { Subscription, Observable, timer, map, share, BehaviorSubject } from 'rxjs';
import { ReceiptPreviewModalComponent } from '../receipt-preview-modal/receipt-preview-modal.component';

interface OrderTime {
  orderId: string;
  time: string;
  isWarning: boolean;
}

@Component({
  selector: 'app-kitchen-display',
  templateUrl: './kitchen-display.component.html',
  styleUrls: ['./kitchen-display.component.scss'],
  standalone: true,
  imports: [CommonModule, DatePipe, ReceiptPreviewModalComponent]
})
export class KitchenDisplayComponent implements OnInit, OnDestroy {
  activeOrders: Order[] = [];
  archivedOrders: Order[] = [];
  showArchived = false;
  isSyncing = false;
  private subscriptions: Subscription[] = [];
  previewReceiptUrl: string | null = null;
  private currentPrintRequest: PrintRequest | null = null;
  orderTimes$ = new BehaviorSubject<OrderTime[]>([]);
  hasDelayedOrders = false;
  delayedOrdersCount = 0;

  constructor(
    private ordersService: OrdersService,
    private printerService: PrinterService,
    private socketService: SocketService
  ) {
    // Создаем таймер для обновления времени
    const subscription = timer(0, 1000).pipe(
      map(() => {
        const times = this.activeOrders.map(order => ({
          orderId: order.order_id,
          time: this.formatOrderAge(order.created_at),
          isWarning: this.getOrderAge(order.created_at) > 60
        }));
        this.orderTimes$.next(times);

        // Обновляем количество опаздывающих заказов
        const delayedOrders = this.activeOrders.filter(order => 
          this.getOrderAge(order.created_at) > 60
        );
        this.delayedOrdersCount = delayedOrders.length;
        this.hasDelayedOrders = this.delayedOrdersCount > 0;
      }),
      share()
    ).subscribe();

    this.subscriptions.push(subscription);
  }

  getOrderTime(orderId: string): Observable<OrderTime | undefined> {
    return this.orderTimes$.pipe(
      map(times => times.find(t => t.orderId === orderId))
    );
  }

  ngOnInit() {
    this.loadOrders();
    this.setupSocketListeners();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadOrders() {
    this.subscriptions.push(
      this.ordersService.getActiveOrders().subscribe(orders => {
        // Сортируем заказы по времени создания (новые сверху)
        this.activeOrders = orders.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        window.scrollTo(0, 0);
      }),
      this.ordersService.getArchivedOrders().subscribe(orders => {
        // Сортируем архивные заказы по времени создания (новые сверху)
        this.archivedOrders = orders.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      })
    );
  }

  private refreshActiveOrders() {
    this.ordersService.getActiveOrders().subscribe(orders => {
      // Сортируем заказы по времени создания (новые сверху)
      this.activeOrders = orders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }

  private setupSocketListeners() {
    this.subscriptions.push(
      this.socketService.fromEvent<Order>('newOrder').subscribe(order => {
        this.activeOrders = [order, ...this.activeOrders];
      }),
      this.socketService.fromEvent<Order>('orderUpdate').subscribe(updatedOrder => {
        if (updatedOrder.status === 'archived') {
          // Проверяем, не существует ли уже этот заказ в архиве
          const existingArchived = this.archivedOrders.find(o => o.order_id === updatedOrder.order_id);
          if (!existingArchived) {
            // Обновляем статус в активном заказе, чтобы показать все галочки
            this.activeOrders = this.activeOrders.map(o => {
              if (o.order_id === updatedOrder.order_id) {
                return updatedOrder;
              }
              return o;
            });

            // Добавляем задержку перед архивацией
            setTimeout(() => {
              this.activeOrders = this.activeOrders.filter(o => o.order_id !== updatedOrder.order_id);
              this.archivedOrders = [updatedOrder, ...this.archivedOrders];
            }, 1000); // Задержка 1 секунда
          }
        } else {
          this.activeOrders = this.activeOrders.map(o => {
            if (o.order_id !== updatedOrder.order_id) return o;
            
            // Сохраняем статусы единиц для каждого продукта
            const updatedProducts = updatedOrder.products.map(updatedProduct => {
              const existingProduct = o.products.find(p => p.product_id === updatedProduct.product_id);
              if (existingProduct && existingProduct.units) {
                return {
                  ...updatedProduct,
                  units: existingProduct.units
                };
              }
              return updatedProduct;
            });

            return {
              ...updatedOrder,
              products: updatedProducts
            };
          });
        }
      })
    );
  }

  getUnitArray(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }

  updateUnitStatus(orderId: string, productId: string, unitIndex: number) {
    const orderIndex = this.activeOrders.findIndex(o => o.order_id === orderId);
    if (orderIndex === -1) return;

    // Создаем глубокую копию массива заказов
    const updatedOrders = [...this.activeOrders];
    const order = { ...updatedOrders[orderIndex] };
    updatedOrders[orderIndex] = order;

    const productIndex = order.products.findIndex(p => p.product_id === productId);
    if (productIndex === -1) return;

    // Создаем глубокую копию массива продуктов
    order.products = [...order.products];
    const product = { ...order.products[productIndex] };
    order.products[productIndex] = product;

    // Инициализируем массив units, если его нет
    if (!product.units) {
      product.units = [];
    } else {
      // Создаем копию массива units
      product.units = [...product.units];
    }

    // Инициализируем конкретную единицу, если её нет
    if (!product.units[unitIndex]) {
      product.units[unitIndex] = { status: 'new' };
    }

    // Определяем следующий статус
    const currentStatus = product.units[unitIndex].status;
    let nextStatus: 'new' | 'cooking' | 'ready';
    switch (currentStatus) {
      case 'new':
        nextStatus = 'cooking';
        break;
      case 'cooking':
        nextStatus = 'ready';
        break;
      default:
        nextStatus = 'new';
    }

    // Обновляем локальное состояние только для конкретной единицы
    product.units[unitIndex] = { ...product.units[unitIndex], status: nextStatus };
    
    // Обновляем весь массив заказов
    this.activeOrders = updatedOrders;

    // Проверяем, все ли единицы всех продуктов готовы
    const allUnitsReady = order.products.every(p => {
      if (!p.units || p.units.length < p.count) return false;
      return p.units.every(unit => unit?.status === 'ready');
    });

    // Обновляем статус через сервис
    this.ordersService.updateProductStatus(orderId, productId, unitIndex, nextStatus)
      .subscribe({
        next: () => {
          // Удаляем локальную логику архивации, так как она будет обработана через WebSocket
          console.log('Status updated successfully');
        },
        error: (error: Error) => {
          console.error('Error updating status:', error);
          // В случае ошибки возвращаем предыдущий статус
          const revertOrder = this.activeOrders.find(o => o.order_id === orderId);
          if (revertOrder) {
            const revertProduct = revertOrder.products.find(p => p.product_id === productId);
            if (revertProduct && revertProduct.units) {
              revertProduct.units[unitIndex] = { ...revertProduct.units[unitIndex], status: currentStatus };
            }
          }
        }
      });
  }

  getStatusButtonText(status: string): string {
    switch (status) {
      case 'new':
        return 'Начать готовить';
      case 'cooking':
        return 'Готово';
      case 'ready':
        return '✔';
      default:
        return 'Начать готовить';
    }
  }

  isStatusButtonDisabled(status: string): boolean {
    return status === 'ready';
  }

  printUnitReceipt(order: Order, product: OrderProduct, unitIndex: number) {
    console.log('Attempting to print receipt for:', {
      order_id: order.order_id,
      product_name: product.product_name,
      unitIndex,
      receipt_url: product.units?.[unitIndex]?.receipt_url
    });

    if (!product.units?.[unitIndex]?.receipt_url) {
      console.error('No receipt URL available for this unit');
      return;
    }

    // Сохраняем данные для печати
    this.currentPrintRequest = {
      receipt_url: product.units[unitIndex].receipt_url!,
      order_info: {
        order_id: order.order_id,
        product_name: product.product_name,
        modifications: product.modifications?.map(m => ({
          name: m['name'],
          group_name: m['group_name']
        })),
        ingredients: product.ingredients?.map(i => ({
          name: i['name'],
          removed: i['removed'],
          extra: i['extra']
        }))
      }
    };

    // Показываем модальное окно
    this.previewReceiptUrl = product.units[unitIndex].receipt_url!;
  }

  onPrintClicked() {
    if (this.currentPrintRequest) {
      console.log('Sending print request:', this.currentPrintRequest);

      this.printerService.printReceipt(this.currentPrintRequest).subscribe({
        next: (response) => {
          console.log('Print request successful:', response);
        },
        error: (error) => {
          console.error('Error printing receipt:', error);
        }
      });
    }

    // Закрываем модальное окно
    this.previewReceiptUrl = null;
    this.currentPrintRequest = null;
  }

  getOrderAge(createdAt: string): number {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  }

  formatOrderAge(createdAt: string): string {
    const seconds = this.getOrderAge(createdAt);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${formattedMinutes}:${formattedSeconds}`;
  }

  syncMenu() {
    this.isSyncing = true;
    this.ordersService.syncMenu().subscribe({
      next: () => {
        this.isSyncing = false;
      },
      error: (err) => {
        console.error('Error syncing menu:', err);
        this.isSyncing = false;
      }
    });
  }
} 
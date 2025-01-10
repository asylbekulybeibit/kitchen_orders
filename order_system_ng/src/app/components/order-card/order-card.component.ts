import { Component, Input, OnChanges, OnInit, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Order, OrderItemStatus, PrintData } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { ReceiptPreviewComponent } from '../receipt-preview/receipt-preview.component';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    ReceiptPreviewComponent
  ],
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.scss']
})
export class OrderCardComponent implements OnChanges, OnInit {
  @Input() order!: Order;
  @Input() isArchived: boolean = false;
  @Output() orderArchived = new EventEmitter<Order>();

  constructor(
    private orderService: OrderService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (!this.order || !this.order._id) {
      console.error('Заказ не был корректно инициализирован');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order'] && !this.isArchived) {
      this.checkOrderCompletion();
    }
  }

  onPrint(orderId: string, itemId: string, unitIndex: number): void {
    if (!orderId || !itemId) {
      console.error('Отсутствует ID заказа или позиции');
      return;
    }

    const item = this.order.items.find(i => i._id === itemId);
    if (!item) {
      console.error('Позиция не найдена');
      return;
    }

    this.orderService.generateReceipt(orderId, itemId, unitIndex).subscribe({
      next: (response) => {
        if (response.success) {
          // Открываем диалог предпросмотра чека
          const dialogRef = this.dialog.open(ReceiptPreviewComponent, {
            data: { receiptUrl: response.receiptUrl },
            width: '600px'
          });

          // Обрабатываем результат закрытия диалога
          dialogRef.afterClosed().subscribe(result => {
            if (result?.print) {
              // Если пользователь нажал "Печать", отправляем на принтер
              this.orderService.sendToPrinter(response.receiptUrl).subscribe({
                next: () => {
                  console.log('Чек отправлен на печать');
                  this.orderService.updateItemPrintStatus(orderId, itemId, unitIndex).subscribe({
                    next: (updatedOrder) => {
                      this.order = updatedOrder;
                    },
                    error: (error) => {
                      console.error('Ошибка при обновлении статуса печати:', error);
                    }
                  });
                },
                error: (error) => {
                  console.error('Ошибка при отправке на принтер:', error);
                }
              });
            }
          });
        }
      },
      error: (error) => {
        console.error('Ошибка при генерации чека:', error);
      }
    });
  }

  onStartCooking(orderId: string, itemId: string, unitIndex: number, currentStatus: OrderItemStatus): void {
    if (!orderId || !itemId) {
      console.error('Отсутствует ID заказа или позиции');
      return;
    }

    this.orderService.updateItemStatus(orderId, itemId, unitIndex).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        const unit = this.order.items
          .find(i => i._id === itemId)
          ?.units[unitIndex];
        
        if (unit && unit.status === 'done') {
          this.checkOrderCompletion();
        }
      },
      error: (error) => {
        console.error('Ошибка при обновлении статуса:', error);
      }
    });
  }

  private checkOrderCompletion(): void {
    if (!this.order || !this.order._id) {
      console.error('Отсутствует заказ или его ID');
      return;
    }

    const allUnitsCompleted = this.order.items.every(item =>
      item.units.every(unit => unit.status === 'done')
    );

    if (allUnitsCompleted && !this.order.isArchived) {
      this.orderService.archiveOrder(this.order._id).subscribe({
        next: (archivedOrder) => {
          this.orderArchived.emit(archivedOrder);
        },
        error: (error) => {
          console.error('Ошибка при архивации заказа:', error);
        }
      });
    }
  }
} 
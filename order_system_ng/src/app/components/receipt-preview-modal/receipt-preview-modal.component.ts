import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-receipt-preview-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="close()">×</button>
        <iframe *ngIf="safeReceiptUrl" [src]="safeReceiptUrl" frameborder="0" width="100%" height="500px"></iframe>
        <div class="modal-footer">
          <button class="print-btn" (click)="onPrint()">Печать</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      padding: 20px;
      border-radius: 8px;
      width: 90%;
      max-width: 400px;
      position: relative;
    }
    .close-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      border: none;
      background: none;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    .close-btn:hover {
      background: #f0f0f0;
    }
    .modal-footer {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
    .print-btn {
      padding: 8px 16px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .print-btn:hover {
      background: #45a049;
    }
  `]
})
export class ReceiptPreviewModalComponent {
  @Input() set receiptUrl(url: string) {
    if (url) {
      const fullUrl = url.startsWith('http') 
        ? url 
        : `${environment.apiUrl.replace('/api', '')}${url}`;
      this.safeReceiptUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
    }
  }
  @Output() printClicked = new EventEmitter<void>();

  safeReceiptUrl?: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {}

  close() {
    this.printClicked.emit();
  }

  onPrint() {
    this.printClicked.emit();
  }
} 
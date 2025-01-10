import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-receipt-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <div class="receipt-preview">
      <iframe [src]="receiptUrl" width="100%" height="500px" frameborder="0"></iframe>
      <div class="actions">
        <button mat-raised-button color="primary" (click)="print()">Печать</button>
        <button mat-button (click)="close()">Закрыть</button>
      </div>
    </div>
  `,
  styles: [`
    .receipt-preview {
      padding: 20px;
    }
    .actions {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class ReceiptPreviewComponent {
  receiptUrl: SafeResourceUrl;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: { receiptUrl: string },
    private dialogRef: MatDialogRef<ReceiptPreviewComponent>,
    private sanitizer: DomSanitizer
  ) {
    this.receiptUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.receiptUrl);
  }

  print(): void {
    this.dialogRef.close({ print: true });
  }

  close(): void {
    this.dialogRef.close();
  }
} 
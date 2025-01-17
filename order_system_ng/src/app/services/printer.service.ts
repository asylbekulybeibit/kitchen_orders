import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PrintRequest } from '../interfaces/order.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrinterService {
  private printerServerUrl = environment.printServerUrl;

  constructor(private http: HttpClient) {}

  printReceipt(printRequest: PrintRequest): Observable<any> {
    return this.http.post(`${this.printerServerUrl}/print`, {
      receiptUrl: printRequest.receipt_url
    });
  }
} 
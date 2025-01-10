import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { KitchenDisplayComponent } from './components/kitchen-display/kitchen-display.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule, 
    KitchenDisplayComponent
  ],
  template: `<app-kitchen-display></app-kitchen-display>`
})
export class AppComponent {} 
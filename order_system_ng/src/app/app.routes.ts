import { Routes } from '@angular/router';
import { KitchenDisplayComponent } from './components/kitchen-display/kitchen-display.component';

export const routes: Routes = [
  { path: '', component: KitchenDisplayComponent },
  { path: '**', redirectTo: '' }
];

import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { KitchenDisplayComponent } from './components/kitchen-display/kitchen-display.component';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  standalone: true,
  imports: [RouterModule]
})
export class AppComponent {
  title = 'Kitchen Orders';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
};

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastResponse } from './shared/components/toast-response/toast-response.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastResponse, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'fitness-web';
}

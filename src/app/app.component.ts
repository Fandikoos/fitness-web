import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastResponse } from './shared/components/toast-response/toast-response.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastResponse],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'fitness-web';
}

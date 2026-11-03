import { Injectable, signal } from '@angular/core';
import { ToastResponse, ToastType } from '../../shared/interfaces/toast-response.interface';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private nextId = 0;
  private readonly _toasts = signal<ToastResponse[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: ToastType, duration: number = 4000): void {
    const id = this.nextId++;
    this._toasts.update(list => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error', 6000);
  }
  
  warning(message: string): void {
    this.show(message, 'warning');
  }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(toast => toast.id !== id));
  }
}

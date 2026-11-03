import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { NgClass } from '../../../../../node_modules/@angular/common/common_module.d-NEF7UaHr';
import { ToastService } from '../../../core/services/toast.service';
import { ToastType } from '../../interfaces/toast-response.interface';

@Component({
  selector: 'app-toast-response',
  imports: [],
  templateUrl: './toast-response.component.html',
  styleUrl: './toast-response.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastResponse {

  protected toastService = inject(ToastService);

  protected readonly alertClass: Record<ToastType, string> = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info',
  };
}

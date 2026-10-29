import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {

  title = input.required<string>();
  message = input.required<string>();
  // true -> shows Delete + Cancel; false -> shows only an OK button
  canDelete = input<boolean>(false);
  confirmLabel = input<string>('Delete');

  confirmed = output<void>();

  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  confirm(): void {
    this.confirmed.emit();
    this.close();
  }
}

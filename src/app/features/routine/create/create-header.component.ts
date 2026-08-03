import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-create-header',
  imports: [],
  templateUrl: './create-header.component.html',
  styleUrl: './create-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateHeaderComponent {
  currentStep = input.required<number>();
  title = input.required<string>();
  subtitle = input.required<string>();
}

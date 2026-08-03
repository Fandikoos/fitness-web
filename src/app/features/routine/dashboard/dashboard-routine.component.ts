import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-routine',
  imports: [
    RouterLink,
  ],
  templateUrl: './dashboard-routine.component.html',
  styleUrl: './dashboard-routine.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardRoutineComponent {}

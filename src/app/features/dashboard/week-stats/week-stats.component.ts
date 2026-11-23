import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { VolumePipe } from '../../../shared/pipes/volume.pipe';
import { WeekStats } from '../week-summary';

@Component({
  selector: 'app-week-stats',
  imports: [VolumePipe],
  templateUrl: './week-stats.component.html',
  styleUrl: './week-stats.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekStatsComponent {
  stats = input.required<WeekStats>();
}

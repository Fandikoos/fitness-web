import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkoutSessionResponse } from '../../../shared/interfaces/workout-session.interface';
import { VolumePipe } from '../../../shared/pipes/volume.pipe';
import { parseIsoDate } from '../../../shared/utils/dates';
import { bestSetLabel, countSessionSets, sessionVolumeKg } from '../week-summary';

@Component({
  selector: 'app-last-session',
  imports: [DatePipe, RouterLink, VolumePipe],
  templateUrl: './last-session.component.html',
  styleUrl: './last-session.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LastSessionComponent {

  // undefined = todavía no hay ninguna sesión esta semana
  session = input<WorkoutSessionResponse | undefined>();

  // "yyyy-MM-dd" → Date local, para que DatePipe no cambie de día por la zona horaria
  date = computed(() => {
    const session = this.session();
    return session ? parseIsoDate(session.sessionDate) : null;
  });

  totalSets = computed(() => {
    const session = this.session();
    return session ? countSessionSets(session) : 0;
  });

  volumeKg = computed(() => {
    const session = this.session();
    return session ? sessionVolumeKg(session) : 0;
  });

  // Resumen corto: nombre del ejercicio + su mejor serie
  exercises = computed(() =>
    [...(this.session()?.exercises ?? [])]
      .sort((a, b) => a.orderInSession - b.orderInSession)
      .map(e => ({ id: e.id, name: e.exerciseTemplate.name, best: bestSetLabel(e.sets) })),
  );
}

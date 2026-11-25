import { DecimalPipe, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  numberAttribute,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { WorkoutSessionService } from '../../../core/services/workout-session.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { MuscleGroupLabelPipe } from '../../../shared/pipes/muscle-group-label.pipe';
import { VolumePipe } from '../../../shared/pipes/volume.pipe';
import { parseIsoDate } from '../../../shared/utils/dates';
import { countSessionSets, sessionVolumeKg } from '../../dashboard/week-summary';

@Component({
  selector: 'app-workout-session-detail',
  imports: [DecimalPipe, RouterLink, VolumePipe, MuscleGroupLabelPipe, ConfirmDialog],
  templateUrl: './workout-session-detail.component.html',
  styleUrl: './workout-session-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkoutSessionDetailComponent {

  private workoutSessionService = inject(WorkoutSessionService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private locale = inject(LOCALE_ID);

  private deleteDialog = viewChild.required<ConfirmDialog>('deleteDialog');

  id = input.required({ transform: numberAttribute });

  // /workout-sessions/abc → numberAttribute('abc') da NaN: no es un id válido
  invalidId = computed(() => Number.isNaN(this.id()));

  // Si cambia el id (p. ej. navegando de un detalle a otro) se vuelve a pedir solo.
  // Si params devuelve undefined, rxResource NO hace la petición (se queda en estado 'idle').
  sessionResource = rxResource({
    params: () => (this.invalidId() ? undefined : this.id()),
    stream: ({ params: id }) => this.workoutSessionService.getById(id),
  });

  // Todo lo que pinta el template, ya calculado. undefined mientras carga o si falla.
  detail = computed(() => {
    if (!this.sessionResource.hasValue()) {
      return undefined;
    }
    const session = this.sessionResource.value();
    const date = parseIsoDate(session.sessionDate);
    const longDate = formatDate(date, "EEEE, d 'de' MMMM 'de' y", this.locale);
    return {
      session,
      // "Martes, 17 de noviembre de 2026" (formatDate lo da en minúscula)
      longDate: longDate.charAt(0).toUpperCase() + longDate.slice(1),
      // "martes 17 de noviembre" para el diálogo de borrado (igual que en el historial)
      shortDate: formatDate(date, "EEEE d 'de' MMMM", this.locale),
      sets: countSessionSets(session),
      volumeKg: sessionVolumeKg(session),
      // [...] copia el array: sort() ordena "in place" y no queremos tocar el valor del recurso
      exercises: [...session.exercises].sort((a, b) => a.orderInSession - b.orderInSession),
    };
  });

  deleteMessage = computed(() => {
    const detail = this.detail();
    if (!detail) {
      return '';
    }
    return `Vas a borrar ${detail.session.routineName} del ${detail.shortDate}, con todas sus series. No se puede deshacer.`;
  });

  askDelete(): void {
    this.deleteDialog().open();
  }

  confirmDelete(): void {
    // Si falla, el errorInterceptor ya muestra el toast de error
    this.workoutSessionService.delete(this.id()).subscribe(() => {
      this.toastService.success('Sesión eliminada');
      this.router.navigate(['/workout-sessions']);
    });
  }
}

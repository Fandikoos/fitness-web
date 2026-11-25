import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WorkoutSessionRequest, WorkoutSessionResponse } from '../../shared/interfaces/workout-session.interface';

@Service()
export class WorkoutSessionService {

  private http = inject(HttpClient);
  private url = environment.workoutSessionsUrl;

  create(workoutSessionRequest: WorkoutSessionRequest): Observable<WorkoutSessionResponse> {
    return this.http.post<WorkoutSessionResponse>(this.url, workoutSessionRequest);
  }

  // Si la rutina no tiene historial, el backend responde 204 y HttpClient emite null
  getLatestByRoutine(routineId: number): Observable<WorkoutSessionResponse | null> {
    return this.http.get<WorkoutSessionResponse | null>(`${this.url}/routines/${routineId}/latest`);
  }

  // Fechas en formato "yyyy-MM-dd" (ambas incluidas). El backend las devuelve
  // ordenadas de la más reciente a la más antigua.
  getBetweenDates(start: string, end: string): Observable<WorkoutSessionResponse[]> {
    return this.http.get<WorkoutSessionResponse[]>(`${this.url}/between-dates`, {
      params: { start, end },
    });
  }

  getById(idWorkoutSession: number): Observable<WorkoutSessionResponse> {
    return this.http.get<WorkoutSessionResponse>(`${this.url}/${idWorkoutSession}`);
  }

  delete(idWorkoutSession: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${idWorkoutSession}`);
  }
}

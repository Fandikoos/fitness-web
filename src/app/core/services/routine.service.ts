import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RoutineRequest, RoutineResponse } from '../../shared/interfaces/routine.interface';
import { catchError, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoutineService {

  private http = inject(HttpClient);
  private url = 'http://localhost:8080/api/workout-service/routines';

  create(routineRequest: RoutineRequest): Observable<RoutineResponse> {
    return this.http.post<RoutineResponse>(this.url, routineRequest);
  }

  update(id: number, routineRequest: RoutineRequest): Observable<RoutineResponse> {
    return this.http.put<RoutineResponse>(`${this.url}/${id}`, routineRequest);
  }

  getByProgramId(programId: number): Observable<RoutineResponse[]> {
    return this.http.get<RoutineResponse[]>(`${this.url}/program/${programId}`).pipe(
      catchError((error) => {
        console.error('Error fetching routines by program ID:', error);
        throw error;
      })
    );
  }

}

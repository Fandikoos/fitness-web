import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RoutineRequest, RoutineResponse } from '../../shared/interfaces/routine.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoutineService {

  private http = inject(HttpClient);
  private url = 'http://localhost:8080/api/workout-service/routines';

  create(routienRequest: RoutineRequest): Observable<RoutineResponse> {
    return this.http.post<RoutineResponse>(this.url, routienRequest);
  }

}

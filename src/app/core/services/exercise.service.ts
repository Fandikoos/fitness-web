import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExerciseTemplateResponse } from '../../shared/interfaces/exercise-template.interface';

@Injectable({
  providedIn: 'root'
})
export class ExerciseService {

  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/workout-service/exercise-templates';

  getAll(): Observable<ExerciseTemplateResponse[]> {
    return this.http.get<ExerciseTemplateResponse[]>(this.baseUrl);
  }
}

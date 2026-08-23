import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExerciseTemplateResponse } from '../../shared/interfaces/exercise-template.interface';
import { PageResponse } from '../../shared/interfaces/page-response';

@Injectable({
  providedIn: 'root'
})
export class ExerciseService {

  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/workout-service/exercise-templates';

  getAll(): Observable<ExerciseTemplateResponse[]> {
    return this.http.get<ExerciseTemplateResponse[]>(this.baseUrl);
  }

  getByMuscleGroup(page: number, size: number, muscleGroup: string): Observable<PageResponse<ExerciseTemplateResponse>> {
    const url = `${this.baseUrl}/muscle-group/${muscleGroup}`;
    return this.http.get<PageResponse<ExerciseTemplateResponse>>(url, {
      params: {
        page: page,
        size: size,
      }
    });
  }



}

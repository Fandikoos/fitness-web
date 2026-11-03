import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExerciseTemplateResponse } from '../../shared/interfaces/exercise-template.interface';
import { PageResponse } from '../../shared/interfaces/page-response';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExerciseService {

  private http = inject(HttpClient);
  private url = environment.exerciseTemplatesUrl;

  getAll(): Observable<ExerciseTemplateResponse[]> {
    return this.http.get<ExerciseTemplateResponse[]>(this.url);
  }

  getByMuscleGroup(page: number, size: number, muscleGroup: string): Observable<PageResponse<ExerciseTemplateResponse>> {
    const url = `${this.url}/muscle-group/${muscleGroup}`;
    return this.http.get<PageResponse<ExerciseTemplateResponse>>(url, {
      params: {
        page: page,
        size: size,
      }
    });
  }

}

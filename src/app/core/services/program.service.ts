import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ProgramRequest, ProgramResponse } from '../../shared/interfaces/program.interface';
import { catchError, delay, Observable, of, shareReplay, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgramService {

  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/workout-service/programs';
  private cache$: Observable<ProgramResponse[]> | null = null;

  getAll(): Observable<ProgramResponse[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<ProgramResponse[]>(this.baseUrl).pipe(
        catchError((error) => {
          console.error('Error fetching programs:', error);
          this.cache$ = null;
          return of([]);
        }),
        shareReplay(1),
      );
    }
    return this.cache$;
  }

  createProgram(programRequest: ProgramRequest): Observable<ProgramResponse> {
    return this.http.post<ProgramResponse>(this.baseUrl, programRequest).pipe(
      tap(() => this.invalidateCache()),
      catchError((error) => {
        console.error('Error creating program:', error);
        return throwError(() => new Error('Failed to create program. Please try again later.'));
      })
    );
  }

  invalidateCache(): void {
    this.cache$ = null;
  }
}

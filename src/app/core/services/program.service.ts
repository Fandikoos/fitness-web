import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ProgramRequest, ProgramResponse } from '../../shared/interfaces/program.interface';
import { catchError, delay, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProgramService {

  private http = inject(HttpClient);
  private url = environment.programUrl;
  private cache$: Observable<ProgramResponse[]> | null = null;

  getAll(): Observable<ProgramResponse[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<ProgramResponse[]>(this.url).pipe(
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

  get(programId: number): Observable<ProgramResponse> {
    return this.http.get<ProgramResponse>(`${this.url}/${programId}`).pipe(
      catchError((error) => {
        console.error('Error fetching program:', error);
        return throwError(() => new Error('Failed to fetch program. Please try again later.'));
      })
    );
  }

  createProgram(programRequest: ProgramRequest): Observable<ProgramResponse> {
    return this.http.post<ProgramResponse>(this.url, programRequest).pipe(
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

  deleteProgram(programId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${programId}`).pipe(
      tap(() => this.invalidateCache()),
      catchError((error) => {
        console.error('Error deleting program:', error);
        return throwError(() => new Error('Failed to delete program. Please try again later.'));
      })
    );
  }

  updateProgram(programId: number, programRequest: ProgramRequest): Observable<ProgramResponse> {
    return this.http.put<ProgramResponse>(`${this.url}/${programId}`, programRequest).pipe(
      tap(() => this.invalidateCache()),
      catchError((error) => {
        console.error('Error updating program:', error);
        return throwError(() => new Error('Failed to update program. Please try again later.'));
      })
    );
  }
}

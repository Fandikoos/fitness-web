import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CreateRoutineStateService {
  programId = signal<number | null>(null);

  reset(): void {
    this.programId.set(null);
  }
}

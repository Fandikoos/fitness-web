import { Service, signal } from '@angular/core';

@Service()
export class CreateRoutineStateService {
  programId = signal<number | null>(null);

  reset(): void {
    this.programId.set(null);
  }
}

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProgramRequest } from '../../../../shared/interfaces/program.interface';
import { ProgramService } from '../../../../core/services/program.service';
import { CreateRoutineStateService } from '../../../../core/services/create-routine-state.service';
import { CreateHeaderComponent } from '../create-header.component';

@Component({
  selector: 'app-step-1-routine',
  imports: [ReactiveFormsModule, CreateHeaderComponent],
  templateUrl: './step-1-routine.component.html',
  styleUrl: './step-1-routine.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step1RoutineComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private programService = inject(ProgramService);
  private createRoutineState = inject(CreateRoutineStateService);
  programId = signal<number | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    isActive: [false],
  });

  ngOnInit(): void {
    const idProgram = this.createRoutineState.programId();
    this.programId.set(idProgram);

    if (idProgram !== null) {
      this.programService.get(idProgram).subscribe({
        next: (program) => {
          this.form.patchValue({
            name: program.name,
            description: program.description,
            isActive: program.active,
          });
        },
        error: (error) => {
          console.error('Error fetching program:', error);
          window.alert('Failed to fetch program details. Please try again later.');
        }
      });
    }
  }

  onCancel(): void {
    this.createRoutineState.reset();
    this.router.navigate(['/']);
  }

  onNext(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const programRequest: ProgramRequest = {
      name: this.form.get('name')?.value || '',
      description: this.form.get('description')?.value || '',
      active: this.form.get('isActive')?.value || false,
    };

    const idProgram = this.programId();

    if (idProgram == null) {
      this.programService.createProgram(programRequest).subscribe({
        next: (response) => {
          this.createRoutineState.programId.set(response.id);
          this.router.navigate(['/create/step-2']);
        },
        error: (error) => {
          console.error('Error creating program:', error);
          window.alert('Failed to create program. Please try again later.');
        },
      });
    } else {
      this.programService.updateProgram(idProgram, programRequest).subscribe({
        next: (response) => {
          this.router.navigate(['/create/step-2']);
        },
        error: (error) => {
          console.error('Error updating program:', error);
          window.alert('Failed to update program. Please try again later.');
        },
      });
    }

  }
}

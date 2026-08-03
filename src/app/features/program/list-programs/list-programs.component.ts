import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ProgramService } from '../../../core/services/program.service';

@Component({
  selector: 'app-list-routine',
  imports: [RouterLink],
  templateUrl: './list-programs.component.html',
  styleUrls: ['./list-programs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListRoutineComponent {

  private programService = inject(ProgramService);

  programs = rxResource({
    loader: () => this.programService.getAll(),
  });
}


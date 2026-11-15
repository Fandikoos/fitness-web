import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CreateRoutineStateService } from '../../../core/services/create-routine-state.service';

interface NavbarOption {
  label: string;
  route: string;
  exact: boolean;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {

  private router = inject(Router);
  private createRoutineState = inject(CreateRoutineStateService);

  readonly navbarOptions: NavbarOption[] = [
    { label: 'Hoy', route: '/', exact: true },
    { label: 'Programas', route: '/programs', exact: false },
  ];

  startNewProgram(): void {
    this.createRoutineState.reset();
    this.router.navigate(['/create/step-1']);
  }
}

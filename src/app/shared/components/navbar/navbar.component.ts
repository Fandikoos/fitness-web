import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
  readonly navbarOptions: NavbarOption[] = [
    { label: 'Today', route: '/', exact: true },
    { label: 'Programs', route: '/programs', exact: false },
  ];
}

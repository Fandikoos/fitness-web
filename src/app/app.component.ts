import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { ToastResponse } from './shared/components/toast-response/toast-response.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastResponse, NavbarComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'fitness-web';

  private router = inject(Router);

  // Las rutas a pantalla completa declaran data: { hideNavbar: true }.
  // Tras cada navegación bajamos hasta la ruta hija más profunda (la página
  // que se está mostrando) y leemos su flag.
  hideNavbar = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => {
        let route = this.router.routerState.snapshot.root;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route.data['hideNavbar'] === true;
      })
    ),
    { initialValue: false }
  );
}

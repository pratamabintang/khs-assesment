import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HamburgerNavComponent } from '../../shared/nav/hamburger-nav.component';
import { UserService } from './user.service';

@Component({
  selector: 'app-user',
  imports: [RouterModule, HamburgerNavComponent],
  standalone: true,
  template: `
    <app-hamburger-nav
      [links]="[
        {
          label: 'Profil',
          path: '/user/profile',
        },
        {
          label: 'Penilaian',
          path: '/user/employees',
        },
      ]"
      (logout)="onLogout()"
    />
    <router-outlet></router-outlet>
  `,
})
export class UserComponent {
  private readonly userService = inject(UserService);

  onLogout() {
    this.userService.logout();
  }
}

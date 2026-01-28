import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HamburgerNavComponent } from '../../shared/nav/hamburger-nav';
import { AdminService } from './admin.service';

@Component({
  selector: 'app-admin',
  imports: [RouterModule, HamburgerNavComponent],
  standalone: true,
  template: `
    <app-hamburger-nav
      [links]="[
        {
          label: 'Manajemen',
          path: '/admin/manage',
        },
        {
          label: 'Histori',
          path: '/admin/submission',
        },
        {
          label: 'Survey Builder',
          path: '/admin/survey',
        },
      ]"
      (logout)="onLogout()"
    />
    <router-outlet></router-outlet>
  `,
})
export class AdminComponent {
  private readonly adminService = inject(AdminService);

  onLogout() {
    this.adminService.logout();
  }
}

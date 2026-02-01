import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HamburgerNavComponent } from '../../shared/nav/hamburger-nav.component';
import { AdminService } from './admin.service';

@Component({
  selector: 'app-admin',
  imports: [RouterModule, HamburgerNavComponent],
  standalone: true,
  templateUrl: './admin.template.html',
})
export class AdminComponent {
  private readonly adminService = inject(AdminService);

  onLogout() {
    this.adminService.logout();
  }
}

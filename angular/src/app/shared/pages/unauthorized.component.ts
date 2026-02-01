import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../pages/auth/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unauthorized.template.html',
})
export class UnauthorizedComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  goBack(): void {
    window.history.length > 1 ? window.history.back() : this.router.navigate(['/']);
  }

  logout(): void {
    this.authService.logout();
  }
}

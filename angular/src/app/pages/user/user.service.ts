import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserExposeDto } from './dto/user-expose.dto';
import { PatchUserPayload } from './dto/user-patch.dto';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private http = inject(HttpClient);
  private baseUrl = 'https://karyahusadasejahtera.web.id/api/auth';

  me() {
    return this.http.get<UserExposeDto>(`${this.baseUrl}/profile`);
  }

  patchMe(payload: PatchUserPayload) {
    return this.http.patch<UserExposeDto>(`${this.baseUrl}/update`, payload);
  }

  logout() {
    this.authService.logout();
  }
}

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserExposeDto } from './dto/user-expose.dto';
import { PatchUserPayload } from './dto/user-patch.dto';
import { AuthService } from '../auth/auth.service';
import { ErrorService } from '../../shared/error.service';
import { catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly authService = inject(AuthService);
  private http = inject(HttpClient);
  private baseUrl = 'https://localhost:3000/api/auth';
  private errorService = inject(ErrorService);

  profile() {
    this.errorService.clearError();
    return this.http
      .get<UserExposeDto>(`${this.baseUrl}/profile`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  patch(payload: PatchUserPayload) {
    this.errorService.clearError();
    return this.http
      .patch<UserExposeDto>(`${this.baseUrl}/update`, payload)
      .pipe(catchError((err) => this.handleError(err)));
  }

  logout() {
    this.authService.logout();
  }

  private handleError(err: HttpErrorResponse) {
    const rawMsg = err.error?.message;

    let messages: string[] = [];

    if (Array.isArray(rawMsg)) {
      messages = rawMsg.filter((x) => typeof x === 'string' && x.trim().length > 0);
    } else if (typeof rawMsg === 'string' && rawMsg.trim()) {
      messages = [rawMsg];
    } else if (typeof err.message === 'string' && err.message.trim()) {
      messages = [err.message];
    } else {
      messages = ['Terjadi kesalahan. Silakan coba lagi.'];
    }

    this.errorService.showError(messages);
    return throwError(() => messages);
  }
}

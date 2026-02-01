import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap, tap, throwError, timeout } from 'rxjs';
import { ErrorService } from '../../shared/error.service';
import { AuthStateService } from './auth-state.service';
import { Router } from '@angular/router';
import { RoleEnum } from '../../shared/type/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResetPasswordQuery } from './query/reset-password.query';
import { UserResponse } from './response/user.response';
import { AccessTokenResponse } from './response/access-token.response';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);
  private authStateService = inject(AuthStateService);
  private router = inject(Router);

  private readonly baseUrl = 'https://localhost:3000/api';

  readonly ROLE_HOME: Partial<Record<RoleEnum, string>> = {
    [RoleEnum.ADMIN]: '/admin',
    [RoleEnum.USER]: '/user',
  };

  register(body: CreateUserDto): Observable<UserResponse> {
    this.errorService.clearError();

    return this.http
      .post<UserResponse>(`${this.baseUrl}/auth/register`, body)
      .pipe(catchError((err) => this.handleError(err)));
  }

  login(body: LoginDto): Observable<AccessTokenResponse> {
    this.errorService.clearError();

    return this.http
      .post<AccessTokenResponse>(`${this.baseUrl}/auth/login`, body, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.authStateService.setAccessToken(res.accessToken);

          const role = this.extractRoleFromToken(res.accessToken);
          if (role) this.authStateService.setRole(role);

          this.redirectAfterLogin(role);
        }),
        catchError((err) => this.handleError(err)),
      );
  }

  refresh(): Observable<AccessTokenResponse> {
    this.errorService.clearError();

    return this.http
      .get<{ csrfToken: string }>(`${this.baseUrl}/auth/csrf`, { withCredentials: true })
      .pipe(
        map((r) => r.csrfToken),
        switchMap((csrfToken) => {
          if (!csrfToken) throw new Error('Missing csrfToken from /auth/csrf');
          return this.http.post<AccessTokenResponse>(
            `${this.baseUrl}/auth/refresh`,
            {},
            {
              withCredentials: true,
              headers: { 'X-CSRF-Token': csrfToken },
            },
          );
        }),
        timeout(5000),
        tap((res) => {
          this.authStateService.setAccessToken(res.accessToken);

          const role = this.extractRoleFromToken(res.accessToken);
          if (role) this.authStateService.setRole(role);
        }),
        catchError((err: HttpErrorResponse) => {
          this.authStateService.clear();
          return throwError(() => err);
        }),
      );
  }

  logout(): void {
    this.http
      .post(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.authStateService.clear();
        this.router.navigate(['/auth', 'login']);
      });
  }

  forgetPassword(payload: ForgetPasswordDto): Observable<void> {
    this.errorService.clearError();

    return this.http
      .post<void>(`${this.baseUrl}/auth/forget-password`, payload)
      .pipe(catchError((err) => this.handleError(err)));
  }

  resetPassword(body: ResetPasswordDto, query: ResetPasswordQuery): void {
    this.errorService.clearError();

    this.http
      .post(`${this.baseUrl}/auth/reset-password?email=${query.email}&token=${query.token}`, body)
      .pipe(catchError((err) => this.handleError(err)))
      .subscribe(() => {
        this.router.navigate(['/auth', 'login']);
      });
  }

  getProfile(): Observable<UserResponse> {
    this.errorService.clearError();

    return this.http
      .get<UserResponse>(`${this.baseUrl}/auth/profile`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  private decodeJwtPayload(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

      const json = decodeURIComponent(
        atob(padded)
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join(''),
      );

      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private extractRoleFromToken(token: string): RoleEnum | null {
    const payload = this.decodeJwtPayload(token);
    if (!payload) return null;

    const raw =
      payload.role ??
      (Array.isArray(payload.roles) ? payload.roles[0] : null) ??
      payload.user?.role;

    if (typeof raw !== 'string') return null;

    const roleLower = raw.toLowerCase();

    if (roleLower === RoleEnum.USER) return RoleEnum.USER;
    if (roleLower === RoleEnum.ADMIN) return RoleEnum.ADMIN;

    return null;
  }

  private redirectAfterLogin(role: RoleEnum | null): void {
    if (!role) {
      this.router.navigate(['/unauthorized']);
      return;
    }

    const target = this.ROLE_HOME[role];

    if (!target) {
      this.router.navigate(['/unauthorized']);
      return;
    }

    this.router.navigateByUrl(target);
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

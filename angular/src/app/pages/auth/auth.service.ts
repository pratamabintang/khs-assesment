import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError, timeout } from 'rxjs';
import { ErrorService } from '../../shared/error.service';
import { AuthStateService } from './auth-state.service';
import { Router } from '@angular/router';
import { RoleEnum } from '../../shared/type/role.enum';

export interface CreateUserDtoPayload {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  province: string;
  regency: string;
  district: string;
  village: string;
  fullAddress: string;
}

export interface RegisterResponse {
  message?: string;
  data?: any;
}

export interface LoginDtoPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface ForgetPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  password: string;
}

export interface ResetPasswordParams {
  email: string;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);
  private authStateService = inject(AuthStateService);
  private router = inject(Router);

  private readonly baseUrl = 'https://karyahusadasejahtera.web.id/api';

  private readonly ROLE_HOME: Partial<Record<RoleEnum, string>> = {
    [RoleEnum.ADMIN]: '/admin',
    [RoleEnum.USER]: '/user',
  };

  register(payload: CreateUserDtoPayload): Observable<RegisterResponse> {
    this.errorService.clearError();

    return this.http
      .post<RegisterResponse>(`${this.baseUrl}/auth/register`, payload)
      .pipe(catchError((err) => this.handleError(err)));
  }

  login(payload: LoginDtoPayload): Observable<LoginResponse> {
    this.errorService.clearError();

    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, payload, { withCredentials: true })
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

  refresh(): Observable<string> {
    this.errorService.clearError();

    return this.http
      .post<{
        accessToken: string;
      }>(`${this.baseUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        timeout(5000),
        tap((res) => {
          this.authStateService.setAccessToken(res.accessToken);

          const role = this.extractRoleFromToken(res.accessToken);
          if (role) this.authStateService.setRole(role);
        }),
        map((res) => res.accessToken),
        catchError((err: HttpErrorResponse) => {
          this.authStateService.clear();
          return throwError(() => err);
        }),
      );
  }

  logout() {
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

  resetPassword(payload: ResetPasswordDto, param: ResetPasswordParams): Observable<Object> {
    this.errorService.clearError();

    return this.http
      .post(
        `${this.baseUrl}/auth/reset-password?email=${param.email}&token=${param.token}`,
        payload,
      )
      .pipe(catchError((err) => this.handleError(err)));
  }

  getProfile() {
    return this.http.get(`${this.baseUrl}/auth/profile`);
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

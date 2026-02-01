import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AuthStateService } from './auth-state.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private apiBase = 'https://karyahusadasejahtera.web.id/api';
  private refreshing = false;
  private refreshedToken$ = new BehaviorSubject<string | null>(null);

  constructor(
    private auth: AuthService,
    private state: AuthStateService,
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isApiCall = req.url.startsWith(this.apiBase);

    const skipAuthHeader =
      req.url.includes('/auth/login') ||
      req.url.includes('/auth/register') ||
      req.url.includes('/auth/refresh') ||
      req.url.includes('/auth/forget-password') ||
      req.url.includes('/auth/reset-password');

    const skip401Refresh =
      req.url.includes('/auth/login') ||
      req.url.includes('/auth/refresh') ||
      req.url.includes('/auth/logout');

    const token = this.state.getAccessToken();

    const authReq =
      isApiCall && token && !skipAuthHeader
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next.handle(authReq).pipe(
      catchError((err: unknown) => {
        if (
          !(err instanceof HttpErrorResponse) ||
          err.status !== 401 ||
          !isApiCall ||
          skip401Refresh
        ) {
          return throwError(() => err);
        }

        if (this.refreshing) {
          return this.refreshedToken$.pipe(
            filter((t) => t !== null),
            take(1),
            switchMap((newToken) =>
              next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })),
            ),
          );
        }

        this.refreshing = true;
        this.refreshedToken$.next(null);

        return this.auth.refresh().pipe(
          switchMap((res) => {
            this.refreshing = false;
            this.refreshedToken$.next(res.accessToken);

            return next.handle(
              req.clone({
                setHeaders: { Authorization: `Bearer ${res.accessToken}` },
              }),
            );
          }),
          catchError((err) => {
            this.refreshing = false;
            this.auth.logout();
            return throwError(() => err);
          }),
        );
      }),
    );
  }
}

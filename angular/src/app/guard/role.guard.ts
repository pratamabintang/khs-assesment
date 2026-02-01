import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { RoleEnum } from '../shared/type/role.enum';
import { AuthService } from '../pages/auth/auth.service';
import { AuthStateService } from '../pages/auth/auth-state.service';

function decodeJwtPayload(token: string): any | null {
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

function extractRoleFromToken(token: string): RoleEnum | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const raw =
    payload.role ?? (Array.isArray(payload.roles) ? payload.roles[0] : null) ?? payload.user?.role;

  const roleStr =
    typeof raw === 'string'
      ? raw
      : raw && typeof raw === 'object' && typeof raw.name === 'string'
        ? raw.name
        : null;

  if (!roleStr) return null;

  const normalized = roleStr.toString().toUpperCase();

  return normalized as unknown as RoleEnum;
}

function checkAllowed(role: RoleEnum | null, allowed: RoleEnum[]): boolean {
  if (!role) return false;

  const roleNorm = role.toString().toUpperCase();
  return allowed.some((a) => a.toString().toUpperCase() === roleNorm);
}

export function RoleGuard(allowed: RoleEnum[]): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    const authState = inject(AuthStateService);
    const router = inject(Router);

    const deny = (): UrlTree => router.createUrlTree(['/unauthorized']);
    const goLogin = (): UrlTree => router.createUrlTree(['/user', 'login']);

    const token = authState.getAccessToken();

    if (token) {
      const role = authState.getRole() ?? extractRoleFromToken(token);

      if (role && !authState.getRole()) authState.setRole(role);

      return checkAllowed(role, allowed) ? true : deny();
    }

    return auth.refresh().pipe(
      map((res) => {
        const role = extractRoleFromToken(res.accessToken);

        if (role) authState.setRole(role);

        return checkAllowed(role, allowed) ? true : deny();
      }),
      catchError(() => of(goLogin())),
    );
  };
}

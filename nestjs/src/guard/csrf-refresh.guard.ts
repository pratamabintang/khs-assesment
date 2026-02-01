import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class RefreshCsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const csrfCookie = req.cookies?.csrf_token as string | undefined;
    const csrfHeader =
      (req.headers['x-csrf-token'] as string | undefined) ||
      (req.headers['x-xsrf-token'] as string | undefined);

    if (!csrfCookie || !csrfHeader) {
      throw new ForbiddenException('Missing CSRF token');
    }
    console.log(csrfCookie);
    console.log(csrfHeader);
    if (csrfCookie !== csrfHeader) {
      throw new ForbiddenException('Invalid CSRF token');
    }
    return true;
  }
}

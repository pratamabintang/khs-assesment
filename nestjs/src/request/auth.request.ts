import { Request } from 'express';
import { JwtPayload } from '../auth/jwt-payload.type';

export interface AuthRequest extends Request {
  user: JwtPayload;
}

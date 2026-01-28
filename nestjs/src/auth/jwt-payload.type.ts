import { RoleEnum } from '../users/role.enum';

export interface JwtPayload {
  sub: string;
  role: RoleEnum;
}

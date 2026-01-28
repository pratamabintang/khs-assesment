import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from '../users/role.enum';

export const ROLE_KEY = 'roles';
export const Role = (role: RoleEnum) => SetMetadata(ROLE_KEY, role);

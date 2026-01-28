import { CanMatchFn } from '@angular/router';
import { RoleGuard } from './role.guard';
import { RoleEnum } from '../shared/type/role.enum';

export const onlyAdmin: CanMatchFn[] = [RoleGuard([RoleEnum.ADMIN])];
export const onlyClient: CanMatchFn[] = [RoleGuard([RoleEnum.USER])];
export const bothRole: CanMatchFn[] = [RoleGuard([RoleEnum.ADMIN, RoleEnum.USER])];

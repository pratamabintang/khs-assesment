import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from 'src/decorator/role.decorator';
import { RoleEnum } from './role.enum';
import type { AuthRequest } from 'src/request/auth.request';
import { UserIdParam } from './param/user-id.param';
import { UserResponse } from './response/user.response';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('')
  @Role(RoleEnum.ADMIN)
  async getAll(): Promise<UserResponse[] | null> {
    const users = await this.usersService.findAll();
    return UserResponse.fromArray(users ?? []);
  }

  @Delete(':userId')
  @Role(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() req: AuthRequest,
    @Param() param: UserIdParam,
  ): Promise<void> {
    return await this.usersService.removeUser(req.user, param.userId);
  }
}

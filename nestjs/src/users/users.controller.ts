import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from 'src/decorator/role.decorator';
import { RoleEnum } from './role.enum';
import { User } from './user.entity';
import type { AuthRequest } from 'src/request/auth.request';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('')
  @Role(RoleEnum.ADMIN)
  async getAll(): Promise<User[] | null> {
    return await this.usersService.findAll();
  }

  @Delete(':id')
  @Role(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.usersService.removeUser(req.user, id);
  }
}

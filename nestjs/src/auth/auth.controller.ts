import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Public } from '../decorator/public.decorator';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/user.entity';
import { LoginDto } from '../dto/login.dto';
import { LoginResponse } from '../response/login.response';
import type { AuthRequest } from '../request/auth.request';
// import { Role } from '../decorator/role.decorator';
// import { RoleEnum } from '../users/role.enum';
// import { AdminResponse } from '../response/admin.response';
import { ForgetPasswordDto } from '../dto/forget-password.dto';
import {
  ResetPasswordDto,
  ResetPasswordParams,
} from './dto/reset-password.dto';
import type { Response, Request } from 'express';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

const isProd = true;
// const isProd = process.env.NODE_ENV === 'production';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Post('register')
  @Public()
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    const user = await this.authService.register(createUserDto);
    return user;
  }

  @Post('login')
  @Public()
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const { accessToken, refreshToken } =
      await this.authService.login(loginDto);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return new LoginResponse({ accessToken });
  }

  @Patch('update')
  async updateMe(
    @Req() req: AuthRequest,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    const updated = await this.authService.updateUser(req.user.sub, dto);
    return updated;
  }

  @Post('refresh')
  @Public()
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies.refresh_token as string | undefined;
    if (!token) throw new UnauthorizedException('Missing refresh token cookie');

    const { accessToken, refreshToken } = await this.authService.refresh(token);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }

  @Post('logout')
  async logout(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(req.user.sub);

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/auth/refresh',
    });

    return { message: 'Logged out' };
  }

  @Post('change-password')
  async changePassword(
    @Req() req: AuthRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return await this.authService.changePassword(req.user.sub, dto);
  }

  @Post('forget-password')
  @Public()
  async forgetPassword(
    @Body() forgetPasswordDto: ForgetPasswordDto,
  ): Promise<void> {
    await this.authService.forgotPassword(forgetPasswordDto.email);
  }

  @Post('reset-password')
  @Public()
  async resetPassword(
    @Query() userParams: ResetPasswordParams,
    @Body() dto: ResetPasswordDto,
  ): Promise<void> {
    await this.authService.resetPassword(userParams, dto);
  }

  @Get('profile')
  async profile(@Req() request: AuthRequest): Promise<User> {
    const user = await this.userService.findOne(request.user.sub);

    if (user) {
      return user;
    }

    throw new NotFoundException();
  }

  // @Get('admin')
  // @Role(RoleEnum.ADMIN)
  // adminOnly(): AdminResponse {
  //   return new AdminResponse({ message: 'This for admin only' });
  // }
}

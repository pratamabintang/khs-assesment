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
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Public } from '../decorator/public.decorator';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AccessTokenResponse } from './response/access-token.response';
import type { AuthRequest } from '../request/auth.request';
// import { Role } from '../decorator/role.decorator';
// import { RoleEnum } from '../users/role.enum';
// import { AdminResponse } from '../response/admin.response';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { Response, Request } from 'express';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { UserResponse } from './response/user.response';
import { ResetPasswordQuery } from './query/reset-password.query';
import { Throttle } from '@nestjs/throttler';
import { randomUUID } from 'crypto';
import { RefreshCsrfGuard } from 'src/guard/csrf-refresh.guard';

const isProd = process.env.NODE_ENV === 'production';

@Throttle({
  default: {
    ttl: 60000,
    limit: 10,
  },
})
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Post('register')
  @Public()
  async register(@Body() body: CreateUserDto): Promise<UserResponse> {
    const user = await this.authService.register(body);
    return new UserResponse(user);
  }

  @Post('login')
  @Public()
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenResponse> {
    const { accessToken, refreshToken } = await this.authService.login(body);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.cookie('csrf_token', randomUUID(), {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return new AccessTokenResponse({ accessToken });
  }

  @Patch('update')
  async updateMe(
    @Req() req: AuthRequest,
    @Body() body: UpdateUserDto,
  ): Promise<UserResponse> {
    const updated = await this.authService.updateUser(req.user.sub, body);
    return new UserResponse(updated);
  }

  @Throttle({
    default: {
      ttl: 60000,
      limit: 60,
    },
  })
  @Post('refresh')
  @Public()
  @UseGuards(RefreshCsrfGuard)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenResponse> {
    const token = req.cookies.refresh_token as string | undefined;
    if (!token) throw new UnauthorizedException('Missing refresh token cookie');

    const { accessToken, refreshToken } = await this.authService.refresh(token);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.cookie('csrf_token', randomUUID(), {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return new AccessTokenResponse({ accessToken });
  }

  @Get('csrf')
  @Public()
  @Throttle({
    default: {
      ttl: 60000,
      limit: 60,
    },
  })
  getCsrf(@Req() req: Request): { csrfToken?: string } {
    return { csrfToken: req.cookies?.csrf_token as string | undefined };
  }

  @Post('logout')
  async logout(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(req.user.sub);

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/auth/refresh',
    });
  }

  @Post('change-password')
  async changePassword(
    @Req() req: AuthRequest,
    @Body() body: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(req.user.sub, body);
  }

  @Post('forget-password')
  @Public()
  async forgetPassword(@Body() body: ForgetPasswordDto): Promise<void> {
    await this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @Public()
  async resetPassword(
    @Query() query: ResetPasswordQuery,
    @Body() body: ResetPasswordDto,
  ): Promise<void> {
    await this.authService.resetPassword(query, body);
  }

  @Get('profile')
  async profile(@Req() request: AuthRequest): Promise<UserResponse> {
    const user = await this.userService.findOne(request.user.sub);

    if (user) {
      return new UserResponse(user);
    }

    throw new NotFoundException();
  }

  // @Get('admin')
  // @Role(RoleEnum.ADMIN)
  // adminOnly(): AdminResponse {
  //   return new AdminResponse({ message: 'This for admin only' });
  // }
}

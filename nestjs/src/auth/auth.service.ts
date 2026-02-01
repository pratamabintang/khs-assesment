import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from '../users/password/password.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt-payload.type';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ForgetPassword } from './forget-password/forget-password.entity';
import { Repository } from 'typeorm';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { StringValue } from 'ms';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { ResetPasswordQuery } from './query/reset-password.query';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(ForgetPassword)
    private readonly forgetPasswordRepository: Repository<ForgetPassword>,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly mailService: MailService,
  ) {}

  public async register(createUserDto: CreateUserDto): Promise<User> {
    return await this.userService.createUser(createUserDto);
  }

  public async updateUser(userId: string, dto: UpdateUserDto): Promise<User> {
    return await this.userService.updateUser(userId, dto);
  }

  public async login(
    data: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userService.findOneByEmail(data.email);

    if (
      !user ||
      !(await this.passwordService.verify(data.password, user.password))
    ) {
      throw new UnauthorizedException('invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
    };

    const accessToken = this.generateToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    await this.setRefreshTokenHash(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  public async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const storedHash = await this.getRefreshTokenHash(payload.sub);
    if (!storedHash) throw new UnauthorizedException('No refresh token stored');

    const match = await this.passwordService.verify(refreshToken, storedHash);
    if (!match) throw new UnauthorizedException('Refresh token mismatch');

    const newPayload: JwtPayload = {
      sub: payload.sub,
      role: payload.role,
    };

    const accessToken: string = this.generateToken(newPayload);
    const newRefreshToken: string = this.generateRefreshToken(newPayload);

    await this.setRefreshTokenHash(payload.sub, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  public async logout(userId: string): Promise<void> {
    await this.removeRefreshTokenHash(userId);
  }

  public async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    if (dto.currentPassword === dto.newPassword)
      throw new BadRequestException(
        'new password must be different from current password',
      );

    const user = await this.userService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    if (
      !(await this.passwordService.verify(dto.currentPassword, user.password))
    )
      throw new BadRequestException('something wrong');

    const newPassword = await this.passwordService.hash(dto.newPassword);

    await this.userService.updatePassword(newPassword, user);
    await this.userService.removeRefreshTokenHash(userId);
  }

  public async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.findOneByEmail(email);
    if (!user) throw new NotFoundException('Email tidak terdaftar');

    const existing = await this.forgetPasswordRepository.findOne({
      where: { userId: user.id },
    });

    if (existing && existing.expiresAt.getTime() > Date.now()) {
      throw new ConflictException(
        'Link reset password masih aktif. Silakan cek email atau coba lagi setelah token kedaluwarsa.',
      );
    }

    if (existing && existing.expiresAt.getTime() <= Date.now()) {
      await this.forgetPasswordRepository.delete({ userId: user.id });
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await this.saveResetToken(
      user.id,
      tokenHash,
      new Date(Date.now() + 15 * 60 * 1000),
    );

    const appUrl = process.env.FE_URL || 'http://localhost:4201';
    const resetLink =
      `${appUrl}/auth/reset-password?token=${encodeURIComponent(rawToken)}` +
      `&email=${encodeURIComponent(email)}`;

    await this.mailService.sendResetPasswordEmail(email, resetLink);
  }

  public async resetPassword(
    userParams: ResetPasswordQuery,
    dto: ResetPasswordDto,
  ): Promise<void> {
    const user = await this.userService.findOneByEmail(userParams.email);
    if (!user) throw new NotFoundException('Email tidak terdaftar');

    const forgetToken = await this.forgetPasswordRepository.findOne({
      where: { userId: user.id },
    });

    if (!forgetToken) {
      throw new UnauthorizedException('Token reset tidak valid');
    }

    if (forgetToken.expiresAt.getTime() < Date.now()) {
      await this.forgetPasswordRepository.delete({ userId: user.id });
      throw new UnauthorizedException('Token reset sudah kedaluwarsa');
    }

    const incomingTokenHash = createHash('sha256')
      .update(userParams.token)
      .digest('hex');

    if (incomingTokenHash !== forgetToken.tokenHash) {
      throw new UnauthorizedException('Token reset tidak valid');
    }

    const hashedPassword = await this.passwordService.hash(dto.password);
    await this.userService.updatePassword(hashedPassword, user);

    await this.forgetPasswordRepository.delete({ userId: user.id });
  }

  private generateToken(payload: JwtPayload): string {
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '5m') as StringValue;

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET!,
      expiresIn,
    });
  }

  private generateRefreshToken(payload: JwtPayload): string {
    const expiresIn = (process.env.JWT_EXPIRES_IN_2 ?? '7d') as StringValue;

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_2!,
      expiresIn,
    });
  }

  private async saveResetToken(
    userId: string,
    tokenHash: string,
    expiry: Date,
  ): Promise<void> {
    await this.forgetPasswordRepository.save({
      userId,
      tokenHash,
      expiresAt: expiry,
    });
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET_2!,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async setRefreshTokenHash(
    userId: string,
    token: string,
  ): Promise<void> {
    await this.userService.setRefreshTokenHash(userId, token);
  }

  private async getRefreshTokenHash(userId: string): Promise<string | null> {
    return await this.userService.getRefreshTokenHash(userId);
  }

  private async removeRefreshTokenHash(userId: string): Promise<void> {
    await this.userService.removeRefreshTokenHash(userId);
  }
}

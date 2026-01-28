import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { getMailConfig } from '../config/mail.config';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.transporter = nodemailer.createTransport(
      getMailConfig(this.configService),
    );
    this.logger.log('Mail service initialized');
  }

  async sendResetPasswordEmail(to: string, resetLink: string) {
    try {
      this.logger.log(`Sending reset password email to: ${to}`);

      await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject: 'Reset Password',
        html: `
          <p>Kami menerima permintaan reset password.</p>
          <p>Klik link berikut untuk reset password:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>Jika bukan kamu, abaikan email ini.</p>
        `,
      });

      this.logger.log(`Reset password email sent successfully to: ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send reset password email: ${err}`);
      throw new InternalServerErrorException(
        'Gagal mengirim email reset password. Silakan coba lagi.',
      );
    }
  }
}

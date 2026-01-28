import { ConfigService } from '@nestjs/config';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export const getMailConfig = (
  configService: ConfigService,
): SMTPTransport.Options => ({
  host: configService.get<string>('MAIL_HOST'),
  port: configService.get<number>('MAIL_PORT'),
  secure: configService.get<string>('MAIL_SECURE') === 'true',
  auth: {
    user: configService.get<string>('MAIL_USER'),
    pass: configService.get<string>('MAIL_PASS'),
  },
});

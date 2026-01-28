import { registerAs } from '@nestjs/config';
import type { StringValue } from 'ms';

export interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: StringValue;
  };
}

export const authConfig = registerAs(
  'auth',
  (): AuthConfig => ({
    jwt: {
      secret: process.env.JWT_SECRET as string,
      expiresIn: (process.env.JWT_EXPIRES_IN as StringValue) ?? '60m',
    },
  }),
);

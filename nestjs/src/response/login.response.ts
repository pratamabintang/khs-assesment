import { Expose } from 'class-transformer';

export class LoginResponse {
  @Expose()
  accessToken: string;

  constructor(partial: Partial<LoginResponse>) {
    Object.assign(this, partial);
  }
}

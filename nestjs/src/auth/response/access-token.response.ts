import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AccessTokenResponse {
  @Expose()
  accessToken: string;

  constructor(partial: Partial<AccessTokenResponse>) {
    Object.assign(this, partial);
  }
}

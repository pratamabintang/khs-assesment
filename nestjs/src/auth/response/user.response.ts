import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  phoneNumber: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  fullAddress: string;

  constructor(partial: Partial<UserResponse>) {
    Object.assign(this, partial);
  }
}

import { Exclude, Expose } from 'class-transformer';
import { User } from '../user.entity';

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

  constructor(partial: Partial<UserResponse>) {
    Object.assign(this, partial);
  }

  static fromArray(users: User[]): UserResponse[] {
    return users.map((user) => new UserResponse(user));
  }
}

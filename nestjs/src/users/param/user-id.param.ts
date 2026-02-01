import { IsNotEmpty, IsUUID } from 'class-validator';

export class UserIdParam {
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}

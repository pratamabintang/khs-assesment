import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class ResetPasswordQuery {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @Length(20, 200)
  token: string;
}

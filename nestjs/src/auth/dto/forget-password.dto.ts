import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class ForgetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(254)
  email: string;
}

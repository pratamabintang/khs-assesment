import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/[a-z]/, { message: 'must contain at least one lowercae letter' })
  @Matches(/[A-Z]/, { message: 'must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'must contain at least one number' })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'must contain at least one special character',
  })
  password: string;
}

export class ResetPasswordParams {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @Length(20, 200)
  token: string;
}

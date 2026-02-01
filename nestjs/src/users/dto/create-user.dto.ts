import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsNotEmpty()
  @IsPhoneNumber('ID')
  @MaxLength(16)
  phoneNumber: string;

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

  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  province: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  regency: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  district: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  village: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  fullAddress: string;
}

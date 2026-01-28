import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword!: string;

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
  newPassword!: string;
}

import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsOptional()
  @IsUUID()
  userId: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  position: string | null;

  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}

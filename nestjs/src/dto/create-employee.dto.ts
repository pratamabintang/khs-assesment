import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsOptional()
  @IsUUID()
  userId: string | null;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  position: string | null;

  @IsBoolean()
  @IsOptional()
  isActive: boolean;
}

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class AssignSurvey {
  @IsNotEmpty()
  @IsUUID()
  surveyId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(8)
  mode: 'all' | 'client' | 'employee';

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

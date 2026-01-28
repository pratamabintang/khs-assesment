import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignSurvey {
  @IsNotEmpty()
  @IsString()
  surveyId: string;

  @IsNotEmpty()
  @IsString()
  mode: 'all' | 'client' | 'employee';

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}

import { IsOptional, IsUUID } from 'class-validator';

export class FindAllQuery {
  @IsOptional()
  @IsUUID()
  surveyId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

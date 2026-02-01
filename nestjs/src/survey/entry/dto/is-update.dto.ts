import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class IsUpdateDto {
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;

  @IsNotEmpty()
  @IsUUID()
  surveyId: string;

  @IsNotEmpty()
  @IsString()
  periodMonth: string;
}

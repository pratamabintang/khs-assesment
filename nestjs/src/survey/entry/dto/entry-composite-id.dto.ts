import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class EntryCompositeIdDto {
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;

  @IsNotEmpty()
  @IsUUID()
  surveyId: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsString()
  periodMonth: string;
}

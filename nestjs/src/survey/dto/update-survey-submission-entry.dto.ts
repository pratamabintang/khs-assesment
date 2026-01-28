import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpdateSubmissionAnswerByIdDto {
  @IsNotEmpty()
  @IsUUID()
  entryId: string;

  @IsNotEmpty()
  @IsString()
  noSql: string;
}

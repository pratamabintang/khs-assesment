import { IsMongoId, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateAnswerByIdDto {
  @IsNotEmpty()
  @IsUUID()
  entryId: string;

  @IsNotEmpty()
  @IsMongoId()
  noSql: string;
}

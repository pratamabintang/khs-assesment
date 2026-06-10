import { IsMongoId, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EntryCompositeIdDto } from './entry-composite-id.dto';

export class UpdateAnswerByIdDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EntryCompositeIdDto)
  entryId: EntryCompositeIdDto;

  @IsNotEmpty()
  @IsMongoId()
  noSql: string;
}

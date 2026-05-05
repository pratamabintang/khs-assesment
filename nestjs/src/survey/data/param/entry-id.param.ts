import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { EntryCompositeIdDto } from 'src/survey/entry/dto/update-answer-by-id.dto';
import type { EntryCompositeId } from 'src/survey/entry/entryId.types';

export class EntryCompositeIdParam {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EntryCompositeIdDto)
  entryCompositeId: EntryCompositeId;
}

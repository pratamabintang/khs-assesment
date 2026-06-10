import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DataAnswerDto } from './data-answer.dto';
import type { EntryCompositeId } from 'src/survey/entry/entryId.types';
import { EntryCompositeIdDto } from 'src/survey/entry/dto/entry-composite-id.dto';

export class DataDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EntryCompositeIdDto)
  entryCompositeId!: EntryCompositeId;

  @IsArray()
  @ArrayMinSize(1, {
    message: 'Submission must contain at least 1 question',
  })
  @ValidateNested({ each: true })
  @Type(() => DataAnswerDto)
  answers!: DataAnswerDto[];
}

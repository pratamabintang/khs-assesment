import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DataAnswerDto } from './data-answer.dto';
import { EntryCompositeIdDto } from 'src/survey/entry/dto/update-answer-by-id.dto';
import type { EntryCompositeId } from 'src/survey/entry/entryId.types';

export class DataDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EntryCompositeIdDto)
  entryCompositeId!: EntryCompositeId;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  surveyId!: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  employeeId!: string;

  @IsArray()
  @ArrayMinSize(1, {
    message: 'Submission must contain at least 1 question',
  })
  @ValidateNested({ each: true })
  @Type(() => DataAnswerDto)
  answers!: DataAnswerDto[];
}

import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class UpdateAnswerByIdDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EntryCompositeIdDto)
  entryId: EntryCompositeIdDto;

  @IsNotEmpty()
  @IsMongoId()
  noSql: string;
}

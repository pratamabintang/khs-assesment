import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SurveyAnswerDto } from './survey-answer.dto';

export class SurveySubmissionDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  entryId!: string;

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
  @Type(() => SurveyAnswerDto)
  answers!: SurveyAnswerDto[];
}

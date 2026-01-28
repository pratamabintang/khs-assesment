import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateIf,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SurveyType } from '../survey/survey.type';

export class SurveyAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsEnum(SurveyType)
  type: SurveyType;

  @ValidateIf((o: SurveyType) => o === SurveyType.TEXTAREA)
  @IsString()
  @IsNotEmpty()
  valueText?: string;

  @ValidateIf(
    (o: SurveyType) => o === SurveyType.RADIO || o === SurveyType.RANGE,
  )
  @IsNumber()
  @Min(0)
  valueNumber?: number;
}

export class SurveySubmitDto {
  @IsString()
  @IsNotEmpty()
  surveyId: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyAnswerDto)
  answers: SurveyAnswerDto[];
}

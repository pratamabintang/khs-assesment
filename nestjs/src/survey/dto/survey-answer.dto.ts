import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SurveyType } from '../../survey/survey.type';

export class SurveyAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsEnum(SurveyType)
  @IsNotEmpty()
  type!: SurveyType;

  @IsOptional()
  value!: string | number | null;
}

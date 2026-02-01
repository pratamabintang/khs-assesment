import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { SurveyType } from '../../survey.type';

export class DataAnswerDto {
  @IsUUID()
  @IsNotEmpty()
  questionId!: string;

  @IsEnum(SurveyType)
  @IsNotEmpty()
  type!: SurveyType;

  @ValidateIf(
    (o: DataAnswerDto) => o.type === SurveyType.TEXTAREA && o.value !== null,
  )
  @IsString()
  @ValidateIf(
    (o: DataAnswerDto) =>
      (o.type === SurveyType.RANGE || o.type === SurveyType.RADIO) &&
      o.value !== null,
  )
  @IsNumber()
  value!: string | number | null;
}

import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SurveyType } from '../survey/survey.type';

export class CreateSurveyQuestionDetailDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  explanation: string;

  @IsNotEmpty()
  @IsString()
  shortQuestion: string;

  @IsNotEmpty()
  @IsString()
  point: string;
}

export class CreateSurveyQuestionDto {
  @IsNotEmpty()
  @IsEnum(SurveyType)
  type: SurveyType;

  @IsNotEmpty()
  @IsString()
  title: string;

  // opsional kalau kamu butuh deskripsi per question
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  // RANGE: min/max wajib
  @ValidateIf((o: CreateSurveyQuestionDto) => o.type === SurveyType.RANGE)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  min?: number;

  @ValidateIf((o: CreateSurveyQuestionDto) => o.type === SurveyType.RANGE)
  @IsNotEmpty()
  @IsNumber()
  @Max(100)
  max?: number;

  // RADIO: details wajib minimal 1
  @ValidateIf((o: CreateSurveyQuestionDto) => o.type === SurveyType.RADIO)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDetailDto)
  details?: CreateSurveyQuestionDetailDto[];

  // TEXTAREA: details tidak boleh dikirim (akan ditolak di service biasanya)
  // Kalau mau enforce di DTO juga, biasanya pakai custom validator.
}

export class CreateSurveyDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  // Survey menaungi banyak question
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDto)
  questions?: CreateSurveyQuestionDto[];
}

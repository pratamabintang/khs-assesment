import { PartialType } from '@nestjs/mapped-types';
import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CreateSurveyDto } from './create-survey.dto';
import { SurveyType } from '../survey/survey.type';

export class UpdateSurveyQuestionDetailDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsString()
  shortQuestion?: string;

  @IsOptional()
  @IsString()
  point?: string;
}

export class UpdateSurveyQuestionDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsEnum(SurveyType)
  type?: SurveyType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min?: number;

  @IsOptional()
  @IsNumber()
  @Max(100)
  max?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSurveyQuestionDetailDto)
  details?: UpdateSurveyQuestionDetailDto[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  removeDetailIds?: string[];
}

export class UpdateSurveyDto extends PartialType(CreateSurveyDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSurveyQuestionDto)
  question?: UpdateSurveyQuestionDto[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  removeQuestionIds?: string[];
}

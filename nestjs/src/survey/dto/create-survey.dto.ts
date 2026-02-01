import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SurveyType } from '../survey.type';

export class CreateSurveyQuestionDetailDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  explanation: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  shortQuestion: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(7)
  point: string;
}

export class CreateSurveyQuestionDto {
  @IsNotEmpty()
  @IsEnum(SurveyType)
  type: SurveyType;

  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

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

  @ValidateIf((o: CreateSurveyQuestionDto) => o.type === SurveyType.RADIO)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDetailDto)
  details?: CreateSurveyQuestionDetailDto[];
}

export class CreateSurveyDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  description: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDto)
  questions?: CreateSurveyQuestionDto[];
}

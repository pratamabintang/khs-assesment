import { SurveyType } from '../../../shared/type/survey/survey-type.type';

export interface CreateSurveyQuestionDetailDto {
  title: string;
  explanation: string;
  shortQuestion: string;
  point: string;
}

export interface CreateSurveyQuestionDto {
  type: SurveyType;
  title: string;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  details?: CreateSurveyQuestionDetailDto[];
}

export interface CreateSurveyDto {
  title: string;
  description: string;
  questions?: CreateSurveyQuestionDto[];
}

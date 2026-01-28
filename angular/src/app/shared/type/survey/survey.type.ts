import { SurveyType } from './survey-type.type';

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions?: SurveyQuestion[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SurveyQuestion {
  id: string;
  required: boolean;
  title: string;
  description?: string;
  type: SurveyType;
  min?: number | null;
  max?: number | null;
  details?: SurveyQuestionDetail[];
}

export interface SurveyQuestionDetail {
  id: string;
  title: string;
  explanation: string;
  shortQuestion?: string;
  point: string;
}

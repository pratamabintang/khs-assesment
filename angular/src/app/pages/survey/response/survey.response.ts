import { SurveyQuestionResponse } from './survey-question.response';

export interface SurveyResponse {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  questions?: SurveyQuestionResponse[];
}

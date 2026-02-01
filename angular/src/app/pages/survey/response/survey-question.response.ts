import { SurveyType } from '../../../shared/type/survey/survey-type.type';
import { SurveyQuestionDetailResponse } from './survey-question-detail.response';

export interface SurveyQuestionResponse {
  id: string;
  required: boolean;
  title: string;
  description: string;
  type: SurveyType;
  min?: number | null;
  max?: number | null;
  details?: SurveyQuestionDetailResponse[];
}

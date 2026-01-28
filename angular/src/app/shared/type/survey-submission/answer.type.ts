import { SurveyType } from '../survey/survey-type.type';

export interface Answer {
  questionId: string;
  type: SurveyType;
  value: string | number | null;
}

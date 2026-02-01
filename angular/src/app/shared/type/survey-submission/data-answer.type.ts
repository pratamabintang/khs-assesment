import { SurveyType } from '../survey/survey-type.type';

export interface DataAnswer {
  questionId: string;
  type: SurveyType;
  value: string | number | null;
}

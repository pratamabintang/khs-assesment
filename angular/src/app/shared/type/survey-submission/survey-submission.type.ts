import { SurveyType } from '../survey/survey-type.type';

export interface SurveySubmission {
  surveyId: string;
  employeeId: string;
  answers: Array<{
    questionId: string;
    type: SurveyType;
    value: string | number | null;
  }>;
  totalPoint: number;
}

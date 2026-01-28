import { SurveyType } from '../../shared/type/survey/survey-type.type';

export interface SurveySubmitPayload {
  entryId: string;
  surveyId: string;
  employeeId: string;
  answers: SurveyAnswerDto[];
}

export interface SurveyAnswerDto {
  questionId: string;
  type: SurveyType;
  value: SurveyAnswerValue;
}

export type SurveyAnswerValue = string | number | null;

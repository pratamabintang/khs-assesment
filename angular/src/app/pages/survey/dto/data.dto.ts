import { SurveyType } from '../../../shared/type/survey/survey-type.type';

export interface DataDto {
  entryId: string;
  surveyId: string;
  employeeId: string;
  answers: DataAnswerDto[];
}

export interface DataAnswerDto {
  questionId: string;
  type: SurveyType;
  value: SurveyAnswerValue;
}

export type SurveyAnswerValue = string | number | null;

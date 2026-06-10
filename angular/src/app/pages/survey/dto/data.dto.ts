import { SurveyType } from '../../../shared/type/survey/survey-type.type';

export interface EntryCompositeId {
  employeeId: string;
  surveyId: string;
  userId: string;
  periodMonth: string;
}

export interface DataDto {
  entryCompositeId: EntryCompositeId;
  answers: DataAnswerDto[];
}

export interface DataAnswerDto {
  questionId: string;
  type: SurveyType;
  value: SurveyAnswerValue;
}

export type SurveyAnswerValue = string | number | null;

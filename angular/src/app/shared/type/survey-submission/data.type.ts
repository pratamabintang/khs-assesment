import { SurveyType } from '../survey/survey-type.type';
import { DataAnswer } from './data-answer.type';

export interface Data {
  surveyId: string;
  employeeId: string;
  answers: DataAnswer[];
  totalPoint: number;
}

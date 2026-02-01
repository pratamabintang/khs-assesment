import { Data } from '../../../shared/type/survey-submission/data.type';
import { Survey } from '../../../shared/type/survey/survey.type';

export interface SubmissionResponse {
  survey: Survey;
  data: Data;
}

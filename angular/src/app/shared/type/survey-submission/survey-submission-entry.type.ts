import { Employee } from '../employee.type';
import { Survey } from '../survey/survey.type';
import { User } from '../user.type';

export interface SurveySubmissionEntry {
  id: string;
  employeeId: string;
  employee?: Employee | null;
  surveyId: string;
  survey?: Survey | null;
  userId: string;
  user?: User | null;
  periodMonth: string;
  nosql?: string | null;
}

import { IsNotEmpty, IsUUID } from 'class-validator';

export class SurveyIdParam {
  @IsNotEmpty()
  @IsUUID()
  surveyId: string;
}

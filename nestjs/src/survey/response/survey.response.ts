import { Exclude, Expose } from 'class-transformer';
import { Survey } from '../survey.entity';
import { SurveyQuestionResponse } from './survey-question.response';

@Exclude()
export class SurveyResponse {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  questions?: SurveyQuestionResponse[];

  constructor(partial?: Partial<SurveyResponse>) {
    Object.assign(this, partial);
  }

  static fromArray(surveys: Survey[]) {
    return surveys.map((s) => new SurveyResponse(s));
  }
}

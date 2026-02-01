import { Exclude, Expose } from 'class-transformer';
import { SurveyQuestion } from '../survey-question.entity';
import { SurveyType } from '../survey.type';
import { SurveyQuestionDetailResponse } from './survey-question-detail.response';

@Exclude()
export class SurveyQuestionResponse {
  @Expose()
  id: string;

  @Expose()
  required: boolean;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  type: SurveyType;

  @Expose()
  min?: number | null;

  @Expose()
  max?: number | null;

  @Expose()
  details?: SurveyQuestionDetailResponse[];

  constructor(partial?: Partial<SurveyQuestionResponse>) {
    Object.assign(this, partial);
  }

  static fromArray(questions?: SurveyQuestion[]) {
    return questions?.map((q) => new SurveyQuestionResponse(q)) ?? [];
  }
}

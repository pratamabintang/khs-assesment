import { Exclude, Expose } from 'class-transformer';
import { SurveyQuestionDetail } from '../survey-question-detail.entity';

@Exclude()
export class SurveyQuestionDetailResponse {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  explanation: string;

  @Expose()
  shortQuestion?: string;

  @Expose()
  point: string;

  constructor(partial?: SurveyQuestionDetailResponse) {
    Object.assign(this, partial);
  }

  static fromArray(details?: SurveyQuestionDetail[]) {
    return details?.map((d) => new SurveyQuestionDetailResponse(d)) ?? [];
  }
}

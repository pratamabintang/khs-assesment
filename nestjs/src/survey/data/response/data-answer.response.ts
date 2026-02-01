import { SurveyType } from 'src/survey/survey.type';
import { DataAnswer } from '../data-answer.schema';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DataAnswerResponse {
  @Expose()
  questionId: string;

  @Expose()
  type: SurveyType;

  @Expose()
  value: string | number | null;

  constructor(partial?: Partial<DataAnswerResponse>) {
    Object.assign(this, partial);
  }

  static fromArray(answers: DataAnswer[]): DataAnswerResponse[] {
    return answers.map((a) => new DataAnswerResponse(a)) ?? [];
  }
}

import { Exclude, Expose } from 'class-transformer';
import { Data } from '../data.schema';
import { DataAnswerResponse } from './data-answer.response';

@Exclude()
export class DataResponse {
  @Expose()
  id: string;

  @Expose()
  surveyId: string;

  @Expose()
  employeeId: string;

  @Expose()
  totalPoint: number;

  @Expose()
  answers: DataAnswerResponse[];

  constructor(partial?: Partial<DataResponse>) {
    Object.assign(this, partial);
  }

  static fromArray(items: Data[]): DataResponse[] {
    return items.map((item) => new DataResponse(item));
  }
}

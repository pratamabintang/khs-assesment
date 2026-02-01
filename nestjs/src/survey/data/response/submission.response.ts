import { Survey } from 'src/survey/survey.entity';
import { Data } from '../data.schema';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SubmissionResponse {
  @Expose()
  survey: Survey;

  @Expose()
  data: Data;

  constructor(partial?: Partial<SubmissionResponse>) {
    Object.assign(this, partial);
  }
}

import { Exclude, Expose } from 'class-transformer';
import { Entry } from '../entry.entity';
import { Employee } from 'src/employee/employee.entity';

export class EntryResponse {
  @Expose()
  id: string;

  @Expose()
  employeeId: string;

  @Expose()
  employee: Employee;

  @Expose()
  surveyId: string;

  @Expose()
  userId: string;

  @Expose()
  periodMonth: string;

  @Expose()
  nosql?: string | null;

  constructor(partial?: Partial<EntryResponse>) {
    Object.assign(this, partial);
  }

  static fromArray(entries: Entry[]): EntryResponse[] {
    return entries.map((entry) => new EntryResponse(entry));
  }
}

import { Exclude, Expose } from 'class-transformer';
import { Employee } from '../employee.entity';

@Exclude()
export class EmployeeResponse {
  @Expose()
  id: string;

  @Expose()
  fullName: string;

  @Expose()
  position?: string | null;

  @Expose()
  isActive: boolean;

  @Expose()
  userId?: string | null;

  constructor(partial: Partial<EmployeeResponse>) {
    Object.assign(this, partial);
  }

  static fromArray(employees: Employee[]): EmployeeResponse[] {
    return employees.map((employee) => new EmployeeResponse(employee));
  }
}

import { IsNotEmpty, IsUUID } from 'class-validator';

export class EmployeeIdParam {
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;
}

import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { User } from '../../../../shared/type/user.type';
import { Employee } from '../../../../shared/type/employee.type';

@Component({
  selector: 'app-client-employees-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-employees.template.html',
})
export class ClientEmployeesComponent {
  open = input<boolean>(false);
  client = input<User | null>(null);
  employees = input<Employee[]>([]);

  close = output<void>();
  unassign = output<Employee>();
}

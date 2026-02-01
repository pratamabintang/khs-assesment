import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../shared/type/user.type';
import { Employee } from '../../../../shared/type/employee.type';

export type AssignPayload = {
  clientId: string;
  employeeId: string;
};

@Component({
  selector: 'app-assign-employee-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assign-employee.template.html',
})
export class AssignEmployeeModalComponent {
  open = input<boolean>(false);
  client = input<User | null>(null);
  employees = input<Employee[]>([]);
  filteredEmployees = computed(() =>
    this.employees().filter((employee) => employee.userId === null || employee.userId === ''),
  );

  close = output<void>();
  save = output<AssignPayload>();

  form = signal<AssignPayload>({ clientId: '', employeeId: '' });

  isValid = computed(() => {
    const c = this.client();
    const f = this.form();
    return !!(c?.id && (f.employeeId ?? '').trim());
  });

  constructor() {
    effect(() => {
      if (!this.open()) return;
      this.form.set({ clientId: '', employeeId: '' });
      void this.client();
    });
  }

  patchForm(patch: Partial<AssignPayload>) {
    this.form.update((prev) => ({ ...prev, ...patch }));
  }

  onSelectEmployee(employeeId: string) {
    const id = (employeeId ?? '').toString();
    const emp = this.employees().find((x) => x.id === id);

    if (!emp) {
      this.patchForm({ employeeId: id });
      return;
    }

    this.form.set({
      clientId: this.client()?.id ?? '',
      employeeId: emp.id,
    });
  }

  submit() {
    if (!this.isValid()) return;

    const f = this.form();
    this.save.emit({
      clientId: this.client()?.id ?? '',
      employeeId: (f.employeeId ?? '').trim(),
    });
  }
}

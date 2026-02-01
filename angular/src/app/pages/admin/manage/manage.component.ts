import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { take } from 'rxjs';

import { AssignEmployeeModalComponent, AssignPayload } from './modal/assign-employee.component';
import { ClientEmployeesComponent } from './modal/client-employees.component';
import { EmployeeFormModalComponent, EmployeeFormPayload } from './modal/employee-form.component';
import { AdminService } from '../admin.service';
import { User } from '../../../shared/type/user.type';
import { Employee } from '../../../shared/type/employee.type';

type TabKey = 'clients' | 'employees';

@Component({
  selector: 'app-admin-outsourcing',
  standalone: true,
  imports: [
    CommonModule,
    AssignEmployeeModalComponent,
    ClientEmployeesComponent,
    EmployeeFormModalComponent,
  ],
  templateUrl: './manage.template.html',
})
export class ManageComponent {
  private readonly adminService = inject(AdminService);

  activeTab = signal<TabKey>('clients');
  setTab(tab: TabKey) {
    this.activeTab.set(tab);
  }

  clientSearch = signal<string>('');
  employeeSearch = signal<string>('');

  clients = signal<User[]>([]);
  employees = signal<Employee[]>([]);

  constructor() {
    this.load();
  }

  load() {
    this.adminService.getAllClient().subscribe({
      next: (res) => this.clients.set(Array.isArray(res) ? res : []),
      error: (err) => console.log(err),
    });

    this.adminService.getAllEmployee().subscribe({
      next: (res) => this.employees.set(Array.isArray(res) ? res : []),
      error: (err) => console.log(err),
    });
  }

  activeEmployeeCount = computed(() => this.employees().filter((e) => e.isActive).length);

  filteredClients = computed(() => {
    const q = this.clientSearch().trim().toLowerCase();
    if (!q) return this.clients();
    return this.clients().filter((c) => (c.name ?? '').toLowerCase().includes(q));
  });

  filteredEmployees = computed(() => {
    const q = this.employeeSearch().trim().toLowerCase();
    if (!q) return this.employees();
    return this.employees().filter((e) => (e.fullName ?? '').toLowerCase().includes(q));
  });

  assignModalOpen = signal(false);
  selectedClient = signal<User | null>(null);

  openAssign(c: User) {
    this.selectedClient.set(c);
    this.assignModalOpen.set(true);
  }
  closeAssign() {
    this.assignModalOpen.set(false);
    this.selectedClient.set(null);
  }

  handleAssignSave(payload: AssignPayload) {
    const client = this.selectedClient();
    if (!client) return;

    this.adminService.assignEmployee(payload.employeeId, payload.clientId).subscribe({
      next: () => {
        const now = new Date();
        this.employees.set(
          this.employees().map((e) =>
            e.id !== payload.employeeId
              ? e
              : {
                  ...e,
                  userId: client.id,
                  updatedAt: now,
                },
          ),
        );
        this.closeAssign();
      },
      error: (err) => console.log(err),
    });
  }

  clientEmployeesOpen = signal(false);
  clientEmployeesClient = signal<User | null>(null);

  employeesForClient = computed(() => {
    const cid = this.clientEmployeesClient()?.id ?? '';
    return this.employees().filter((e) => e.userId === cid);
  });

  openClientEmployees(c: User) {
    this.clientEmployeesClient.set(c);
    this.clientEmployeesOpen.set(true);
  }
  closeClientEmployees() {
    this.clientEmployeesOpen.set(false);
    this.clientEmployeesClient.set(null);
  }

  handleUnassign(e: Employee) {
    this.adminService.assignEmployee(e.id).subscribe({
      next: () => {
        const now = new Date();
        this.employees.set(
          this.employees().map((x) => (x.id === e.id ? { ...x, userId: '', updatedAt: now } : x)),
        );
      },
      error: (err) => console.log(err),
    });
  }

  employeeFormOpen = signal(false);
  employeeFormMode = signal<'create' | 'edit'>('create');
  employeeFormEmployee = signal<Employee | null>(null);

  openCreateEmployee() {
    this.employeeFormMode.set('create');
    this.employeeFormEmployee.set(null);
    this.employeeFormOpen.set(true);
  }

  openEditEmployee(e: Employee) {
    this.employeeFormMode.set('edit');
    this.employeeFormEmployee.set(e);
    this.employeeFormOpen.set(true);
  }

  closeEmployeeForm() {
    this.employeeFormOpen.set(false);
    this.employeeFormEmployee.set(null);
  }

  handleEmployeeFormSave(payload: EmployeeFormPayload) {
    const now = new Date();

    if (this.employeeFormMode() === 'create') {
      this.adminService
        .createEmployee(payload.userId, payload.fullName, payload.position, payload.isActive)
        .pipe(take(1))
        .subscribe({
          next: (res) => {
            const newEmployee: Employee = {
              id: res.id,
              fullName: res.fullName,
              position: res.position,
              isActive: res.isActive,
              userId: res.userId ?? '',
            };
            this.employees.update((old) => [...old, newEmployee]);
          },
          error: (err) => console.log(err),
        });
    } else {
      if (payload.id) {
        this.adminService
          .updateEmployee(
            payload.id,
            payload.userId,
            payload.fullName,
            payload.position,
            payload.isActive,
          )
          .pipe(take(1))
          .subscribe({
            next: (res) => {
              this.employees.set(
                this.employees().map((e) =>
                  e.id !== payload.id
                    ? e
                    : {
                        ...e,
                        fullName: res.fullName,
                        position: res.position,
                        isActive: res.isActive,
                        userId: res.userId ?? '',
                        updatedAt: now,
                      },
                ),
              );
            },
            error: (err) => console.log(err),
          });
      }
    }

    this.closeEmployeeForm();
  }

  deleteClient(c: User) {
    this.adminService.removeClient(c.id).subscribe({
      next: () => {
        this.employees.update((old) =>
          old.map((e) => (e.userId === c.id ? { ...e, userId: '' } : e)),
        );
        this.clients.update((old) => old.filter((x) => x.id !== c.id));
      },
      error: (err) => console.log(err),
    });

    if (this.selectedClient()?.id === c.id) this.closeAssign();
    if (this.clientEmployeesClient()?.id === c.id) this.closeClientEmployees();
  }

  deleteEmployee(e: Employee) {
    this.adminService.removeEmployee(e.id).subscribe({
      next: () => this.employees.update((old) => old.filter((x) => x.id !== e.id)),
      error: (err) => console.log(err),
    });
  }

  formatDate(d: Date | string | null | undefined): string {
    if (!d) return '-';

    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return '-';

    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
}

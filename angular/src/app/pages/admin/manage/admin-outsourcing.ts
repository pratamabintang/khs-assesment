import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AssignEmployeeModalComponent, AssignPayload } from './modal/assign-employee.component';
import { ClientEmployeesModalComponent } from './modal/client-employees.component';
import { EmployeeFormModalComponent, EmployeeFormPayload } from './modal/employee-form.component';
import { AdminService } from '../admin.service';
import { take } from 'rxjs';
import { User } from '../../../shared/type/user.type';
import { Employee } from '../../../shared/type/employee.type';

type TabKey = 'clients' | 'employees';

@Component({
  selector: 'app-admin-outsourcing',
  standalone: true,
  imports: [
    CommonModule,
    AssignEmployeeModalComponent,
    ClientEmployeesModalComponent,
    EmployeeFormModalComponent,
  ],
  template: `
    <div class="min-h-screen bg-slate-50">
      <div class="mx-auto max-w-6xl p-6">
        <div
          class="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50"
            aria-hidden="true"
          ></div>

          <div class="relative p-6 sm:p-7">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="space-y-1">
                <div class="inline-flex items-center gap-2">
                  <span
                    class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-slate-800 ring-1 ring-slate-200 shadow-sm"
                    aria-hidden="true"
                  >
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 7.5C4 6.12 5.12 5 6.5 5h11C18.88 5 20 6.12 20 7.5v9c0 1.38-1.12 2.5-2.5 2.5h-11C5.12 19 4 17.88 4 16.5v-9Z"
                        stroke="currentColor"
                        stroke-width="2"
                        opacity="0.9"
                      />
                      <path
                        d="M8 9h8M8 12h8M8 15h5"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  </span>

                  <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
                    Admin Outsourcing
                  </h1>
                </div>

                <p class="text-sm text-slate-600">
                  Kelola perusahaan klien dan karyawan yang disalurkan dalam satu halaman.
                </p>
              </div>

              <div
                class="inline-flex items-center rounded-2xl bg-white/70 p-1 ring-1 ring-slate-200 shadow-sm"
              >
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition
                         focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  [class.bg-slate-900]="activeTab() === 'clients'"
                  [class.text-white]="activeTab() === 'clients'"
                  [class.text-slate-700]="activeTab() !== 'clients'"
                  [class.hover:bg-slate-100]="activeTab() !== 'clients'"
                  (click)="setTab('clients')"
                >
                  Klien
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                    [class.bg-white/20]="activeTab() === 'clients'"
                    [class.text-white]="activeTab() === 'clients'"
                    [class.bg-white]="activeTab() !== 'clients'"
                    [class.text-slate-700]="activeTab() !== 'clients'"
                    [class.ring-1]="activeTab() !== 'clients'"
                    [class.ring-slate-200]="activeTab() !== 'clients'"
                  >
                    {{ clients().length }}
                  </span>
                </button>

                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition
                         focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  [class.bg-slate-900]="activeTab() === 'employees'"
                  [class.text-white]="activeTab() === 'employees'"
                  [class.text-slate-700]="activeTab() !== 'employees'"
                  [class.hover:bg-slate-100]="activeTab() !== 'employees'"
                  (click)="setTab('employees')"
                >
                  Karyawan
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                    [class.bg-white/20]="activeTab() === 'employees'"
                    [class.text-white]="activeTab() === 'employees'"
                    [class.bg-white]="activeTab() !== 'employees'"
                    [class.text-slate-700]="activeTab() !== 'employees'"
                    [class.ring-1]="activeTab() !== 'employees'"
                    [class.ring-slate-200]="activeTab() !== 'employees'"
                  >
                    {{ employees().length }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <section
          *ngIf="activeTab() === 'clients'"
          class="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div
            class="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-fuchsia-600"
          ></div>

          <div class="border-b border-slate-200 bg-slate-50/70 px-6 py-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div class="text-sm font-semibold text-slate-900">Perusahaan Klien</div>
                <div class="text-xs text-slate-600">
                  (Nama, ID) • (Email, Phone) • Bergabung sejak
                </div>
              </div>

              <div class="w-full sm:w-[360px]">
                <label class="sr-only">Cari klien</label>
                <div class="relative">
                  <span
                    class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </span>

                  <input
                    class="w-full rounded-2xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Cari nama klien..."
                    [value]="clientSearch()"
                    (input)="clientSearch.set(($any($event.target).value ?? '').toString())"
                  />

                  <button
                    *ngIf="clientSearch().trim().length > 0"
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400
                         hover:bg-slate-100 hover:text-slate-700"
                    (click)="clientSearch.set('')"
                    aria-label="Clear search"
                  >
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="text-xs text-slate-500">
              Total data:
              <span class="font-semibold text-slate-700">{{ filteredClients().length }}</span>
              dari
              <span class="font-semibold text-slate-700">{{ clients().length }}</span>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="border-b border-slate-200 bg-white">
                <tr class="text-xs font-semibold text-slate-600">
                  <th class="px-6 py-3">(Nama, ID)</th>
                  <th class="px-6 py-3">(Email, Phone)</th>
                  <th class="px-6 py-3">Bergabung sejak</th>
                  <th class="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-slate-100">
                <tr
                  *ngFor="let c of filteredClients(); trackBy: trackById"
                  class="group hover:bg-indigo-50/40"
                >
                  <td class="px-6 py-4">
                    <div class="flex items-start gap-3">
                      <span
                        class="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm"
                        aria-hidden="true"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M3 21h18"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M6 21V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14"
                            stroke="currentColor"
                            stroke-width="2"
                          />
                          <path
                            d="M9 9h6M9 12h6M9 15h6"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                        </svg>
                      </span>

                      <div class="min-w-0">
                        <div class="truncate font-semibold text-slate-900">{{ c.name }}</div>
                        <div class="mt-0.5 text-xs text-slate-500">
                          ID: <span class="font-medium text-slate-700">{{ c.id }}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="px-6 py-4">
                    <div class="font-medium text-slate-800">{{ c.email }}</div>
                    <div class="mt-0.5 text-xs text-slate-500">{{ c.phoneNumber }}</div>
                  </td>

                  <td class="px-6 py-4">
                    <div class="font-medium text-slate-800">{{ formatDate(c.createdAt) }}</div>
                    <div class="mt-0.5 text-xs text-slate-500">
                      Updated:
                      <span class="font-medium text-slate-700">{{ formatDate(c.updatedAt) }}</span>
                    </div>
                  </td>

                  <td class="px-6 py-4">
                    <div class="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm
                             hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        (click)="openClientEmployees(c)"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Z"
                            stroke="currentColor"
                            stroke-width="2"
                          />
                          <path
                            d="M8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Z"
                            stroke="currentColor"
                            stroke-width="2"
                          />
                          <path
                            d="M8 13c-2.76 0-5 1.79-5 4v2h10v-2c0-2.21-2.24-4-5-4Z"
                            stroke="currentColor"
                            stroke-width="2"
                          />
                          <path
                            d="M16 13c-0.33 0-0.65 0.03-0.96 0.08 1.79 0.63 2.96 2.03 2.96 3.72V19h6v-2c0-2.21-2.24-4-5-4Z"
                            stroke="currentColor"
                            stroke-width="2"
                          />
                        </svg>
                        Pegawai
                      </button>

                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm
                             hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        (click)="openAssign(c)"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M12 5v14"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M5 12h14"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                        </svg>
                        Assign
                      </button>

                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm
                             hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        (click)="deleteClient(c)"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M4 7h16"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M10 11v7"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M14 11v7"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M6 7l1 14h10l1-14"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M9 7V4h6v3"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                        </svg>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="filteredClients().length === 0">
                  <td colspan="4" class="px-6 py-10">
                    <div
                      class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"
                    >
                      <div
                        class="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200"
                      >
                        <svg class="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            d="M3 4a2 2 0 012-2h6a2 2 0 012 2v2h2a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V4z"
                          />
                        </svg>
                      </div>
                      <div class="mt-3 text-sm font-semibold text-slate-900">
                        Data tidak ditemukan
                      </div>
                      <div class="mt-1 text-xs text-slate-500">Coba ubah kata kunci pencarian.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="border-t border-slate-200 bg-slate-50/70 px-6 py-3 text-xs text-slate-500">
            Menghapus klien akan meng-unassign semua karyawan yang terkait (userId dikosongkan).
          </div>
        </section>

        <section
          *ngIf="activeTab() === 'employees'"
          class="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div
            class="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-fuchsia-600"
          ></div>

          <div class="border-b border-slate-200 bg-slate-50/70 px-6 py-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div class="text-sm font-semibold text-slate-900">Karyawan</div>
                <div class="text-xs text-slate-600">(Nama, ID) • Posisi • Aktif • Edit • Hapus</div>
                <div class="text-xs text-slate-500">
                  Total data:
                  <span class="font-semibold text-slate-700">{{ filteredEmployees().length }}</span>
                  dari
                  <span class="font-semibold text-slate-700">{{ employees().length }}</span>
                </div>
              </div>

              <div class="flex flex-col gap-2 sm:items-end">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm
                         hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  (click)="openCreateEmployee()"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 5v14"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                    <path
                      d="M5 12h14"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                  Tambah Karyawan
                </button>

                <div class="w-full sm:w-[360px]">
                  <label class="sr-only">Cari karyawan</label>
                  <div class="relative">
                    <span
                      class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </span>

                    <input
                      class="w-full rounded-2xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="Cari nama karyawan..."
                      [value]="employeeSearch()"
                      (input)="employeeSearch.set(($any($event.target).value ?? '').toString())"
                    />

                    <button
                      *ngIf="employeeSearch().trim().length > 0"
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400
                           hover:bg-slate-100 hover:text-slate-700"
                      (click)="employeeSearch.set('')"
                      aria-label="Clear search"
                    >
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="border-b border-slate-200 bg-white">
                <tr class="text-xs font-semibold text-slate-600">
                  <th class="px-6 py-3">(Nama, ID)</th>
                  <th class="px-6 py-3">Posisi</th>
                  <th class="px-6 py-3">Aktif</th>
                  <th class="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-slate-100">
                <tr
                  *ngFor="let e of filteredEmployees(); trackBy: trackById"
                  class="group hover:bg-indigo-50/40"
                >
                  <td class="px-6 py-4">
                    <div class="flex items-start gap-3">
                      <span
                        class="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm"
                        aria-hidden="true"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                            stroke="currentColor"
                            stroke-width="2"
                          />
                        </svg>
                      </span>

                      <div class="min-w-0">
                        <div class="truncate font-semibold text-slate-900">{{ e.fullName }}</div>
                        <div class="mt-0.5 text-xs text-slate-500">
                          ID: <span class="font-medium text-slate-700">{{ e.id }}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                    >
                      {{ e.position }}
                    </span>
                  </td>

                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1"
                      [class.bg-emerald-50]="e.isActive"
                      [class.text-emerald-700]="e.isActive"
                      [class.ring-emerald-200]="e.isActive"
                      [class.bg-amber-50]="!e.isActive"
                      [class.text-amber-800]="!e.isActive"
                      [class.ring-amber-200]="!e.isActive"
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full"
                        [class.bg-emerald-500]="e.isActive"
                        [class.bg-amber-500]="!e.isActive"
                      ></span>
                      {{ e.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>

                  <td class="px-6 py-4">
                    <div class="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm
                             hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        (click)="openEditEmployee(e)"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M12 20h9"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linejoin="round"
                          />
                        </svg>
                        Edit
                      </button>

                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm
                             hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        (click)="deleteEmployee(e)"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M4 7h16"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M10 11v7"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M14 11v7"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M6 7l1 14h10l1-14"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M9 7V4h6v3"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                        </svg>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="filteredEmployees().length === 0">
                  <td colspan="4" class="px-6 py-10">
                    <div
                      class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"
                    >
                      <div
                        class="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200"
                      >
                        <svg class="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M12 12a5 5 0 10-10 0v2h10v-2zM20 14v-2a6 6 0 00-8-5.65" />
                        </svg>
                      </div>
                      <div class="mt-3 text-sm font-semibold text-slate-900">
                        Data tidak ditemukan
                      </div>
                      <div class="mt-1 text-xs text-slate-500">Coba ubah kata kunci pencarian.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="border-t border-slate-200 bg-slate-50/70 px-6 py-3 text-xs text-slate-500">
            Status aktif hanya dikelola dari bagian Karyawan.
          </div>
        </section>

        <app-assign-employee-modal
          [open]="assignModalOpen()"
          [client]="selectedClient()"
          [employees]="employees()"
          (close)="closeAssign()"
          (save)="handleAssignSave($event)"
        />

        <app-client-employees-modal
          [open]="clientEmployeesOpen()"
          [client]="clientEmployeesClient()"
          [employees]="employeesForClient()"
          (close)="closeClientEmployees()"
          (unassign)="handleUnassign($event)"
        />

        <app-employee-form-modal
          [open]="employeeFormOpen()"
          [mode]="employeeFormMode()"
          [clients]="clients()"
          [employee]="employeeFormEmployee()"
          (close)="closeEmployeeForm()"
          (save)="handleEmployeeFormSave($event)"
        />
      </div>
    </div>
  `,
})
export class AdminOutsourcingComponent {
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
      next: (res) => {
        const clientArr = Array.isArray(res) ? res : [];
        clientArr.map((c) => {
          c.createdAt = new Date(c.createdAt);
          c.updatedAt = new Date(c.updatedAt);
        });
        this.clients.set(clientArr);
      },
      error: (err) => console.log(err),
    });

    this.adminService.getAllEmployee().subscribe({
      next: (res) => {
        const employeeArr = Array.isArray(res) ? res : [];
        employeeArr.map((c) => {
          c.createdAt = new Date(c.createdAt);
          c.updatedAt = new Date(c.updatedAt);
        });
        this.employees.set(employeeArr);
      },
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
    this.adminService.assignEmployee(e.id, null).subscribe({
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
              createdAt: now,
              updatedAt: now,
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
      next: () => {
        this.employees.update((old) => old.filter((x) => x.id !== e.id));
      },
      error: (err) => console.log(err),
    });
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }

  formatDate(d: Date) {
    if (!d) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private generateEmployeeId(existingIds: string[]) {
    const nums = existingIds
      .map((id) => {
        const m = /^EMP-(\\d+)$/i.exec(id.trim());
        return m ? Number(m[1]) : NaN;
      })
      .filter((n) => Number.isFinite(n));

    const next = (nums.length ? Math.max(...nums) : 1000) + 1;
    return `EMP-${String(next).padStart(4, '0')}`;
  }
}

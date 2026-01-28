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
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-30">
        <div class="absolute inset-0 bg-black/60" (click)="close.emit()"></div>

        <div
          class="absolute left-1/2 top-1/2 w-[min(720px,calc(100vw-28px))] -translate-x-1/2 -translate-y-1/2
                 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Assign Karyawan"
        >
          <div
            class="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-fuchsia-600"
          ></div>

          <div
            class="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-4"
          >
            <div class="space-y-0.5">
              <div class="text-sm font-semibold text-slate-900">Assign Karyawan</div>
              <div class="text-xs text-slate-600">
                Pilih karyawan dan set nama/posisi jika perlu.
              </div>
            </div>

            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm
                     hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              (click)="close.emit()"
              aria-label="Tutup"
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

          <div class="p-5">
            <div
              class="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div
                class="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50"
                aria-hidden="true"
              ></div>

              <div class="relative p-4">
                <div class="text-xs font-semibold text-slate-600">Klien tujuan</div>
                <div class="mt-0.5 text-sm font-semibold text-slate-900">
                  {{ client()?.name ?? '-' }}
                </div>
                <div class="mt-0.5 text-xs text-slate-500">
                  ID: <span class="font-medium text-slate-700">{{ client()?.id ?? '-' }}</span>
                </div>
              </div>
            </div>

            <!-- Form -->
            <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <!-- select employee -->
              <label class="space-y-1 md:col-span-2">
                <span class="text-xs font-semibold text-slate-600">Pilih Karyawan</span>

                <div class="relative">
                  <select
                    class="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white/80 pl-4 pr-10 text-sm font-semibold text-slate-800 shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    [ngModel]="form().employeeId"
                    (ngModelChange)="onSelectEmployee(($event ?? '').toString())"
                    aria-label="Pilih karyawan"
                  >
                    <option value="" disabled>Pilih karyawan…</option>
                    @for (e of employees(); track e.id) {
                      <option [value]="e.id">{{ e.fullName }} — {{ e.id }}</option>
                    }
                  </select>

                  <span
                    class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </label>

              <div
                class="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-600"
              >
                <span class="font-semibold text-slate-700">*</span>
                Status aktif tidak diedit di sini (ditentukan di tab Karyawan).
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4">
            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm
                     hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              (click)="close.emit()"
            >
              Batal
            </button>

            <button
              type="button"
              class="rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm
                     hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-indigo-200
                     disabled:cursor-not-allowed disabled:opacity-50"
              (click)="submit()"
              [disabled]="!isValid()"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AssignEmployeeModalComponent {
  open = input<boolean>(false);
  client = input<User | null>(null);
  employees = input<Employee[]>([]);

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

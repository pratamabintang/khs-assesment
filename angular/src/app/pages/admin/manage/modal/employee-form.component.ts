import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../shared/type/user.type';
import { Employee } from '../../../../shared/type/employee.type';

export type EmployeeFormPayload = {
  id?: string;
  fullName: string;
  position: string;
  isActive: boolean;
  userId: string | null;
};

@Component({
  selector: 'app-employee-form-modal',
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
          [attr.aria-label]="mode() === 'create' ? 'Tambah Karyawan' : 'Edit Karyawan'"
        >
          <div
            class="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-fuchsia-600"
          ></div>

          <div
            class="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-4"
          >
            <div class="space-y-0.5">
              <div class="text-sm font-semibold text-slate-900">
                {{ mode() === 'create' ? 'Tambah Karyawan' : 'Edit Karyawan' }}
              </div>
              <div class="text-xs text-slate-600">
                Isi data karyawan dan (opsional) assign ke klien.
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
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label class="space-y-1">
                <span class="text-xs font-semibold text-slate-600">Nama</span>
                <input
                  class="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-900 shadow-sm
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Contoh: Siti"
                  [ngModel]="form().fullName"
                  (ngModelChange)="patchForm({ fullName: ($event ?? '').toString() })"
                />
              </label>

              <label class="space-y-1">
                <span class="text-xs font-semibold text-slate-600">Posisi</span>
                <input
                  class="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-900 shadow-sm
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Contoh: Frontend Developer"
                  [ngModel]="form().position"
                  (ngModelChange)="patchForm({ position: ($event ?? '').toString() })"
                />
              </label>

              <label class="space-y-1 md:col-span-2">
                <span class="text-xs font-semibold text-slate-600">Aktif</span>

                <div
                  class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div class="flex items-center gap-3">
                    <input
                      type="checkbox"
                      class="h-4 w-4 accent-indigo-600"
                      [ngModel]="form().isActive"
                      (ngModelChange)="patchForm({ isActive: !!$event })"
                    />
                    <span
                      class="text-sm font-semibold"
                      [class.text-emerald-700]="form().isActive"
                      [class.text-amber-800]="!form().isActive"
                    >
                      {{ form().isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>

                  <span
                    class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1"
                    [class.bg-emerald-50]="form().isActive"
                    [class.text-emerald-700]="form().isActive"
                    [class.ring-emerald-200]="form().isActive"
                    [class.bg-amber-50]="!form().isActive"
                    [class.text-amber-800]="!form().isActive"
                    [class.ring-amber-200]="!form().isActive"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      [class.bg-emerald-500]="form().isActive"
                      [class.bg-amber-500]="!form().isActive"
                    ></span>
                    {{ form().isActive ? 'Aktif' : 'Tidak aktif' }}
                  </span>
                </div>
              </label>

              <label class="space-y-1 md:col-span-2">
                <span class="text-xs font-semibold text-slate-600">Assign ke Klien (opsional)</span>

                <div class="relative">
                  <select
                    class="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white/80 pl-4 pr-10 text-sm font-semibold text-slate-800 shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    [ngModel]="form().userId"
                    (ngModelChange)="patchForm({ userId: $event ? $event : null })"
                    aria-label="Pilih klien"
                  >
                    <option [ngValue]="null">(Tidak ada klien / Bench)</option>
                    @for (c of clients(); track c.id) {
                      <option [value]="c.id">{{ c.name }} — {{ c.id }}</option>
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

                <div class="mt-2 text-[11px] text-slate-500">
                  Jika tidak dipilih, karyawan akan berada di bench (userId kosong).
                </div>
              </label>
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
export class EmployeeFormModalComponent {
  open = input<boolean>(false);
  mode = input<'create' | 'edit'>('create');
  clients = input<User[]>([]);
  employee = input<Employee | null>(null);

  close = output<void>();
  save = output<EmployeeFormPayload>();

  form = signal<EmployeeFormPayload>({
    fullName: '',
    position: '',
    isActive: true,
    userId: '',
  });

  private trimmedFullName = computed(() => (this.form().fullName ?? '').trim());
  private trimmedPosition = computed(() => (this.form().position ?? '').trim());

  isValid = computed(() => !!(this.trimmedFullName() && this.trimmedPosition()));

  constructor() {
    effect(() => {
      if (!this.open()) return;

      const mode = this.mode();
      const emp = this.employee();

      if (mode === 'edit' && emp) {
        this.form.set({
          id: emp.id,
          fullName: emp.fullName ?? '',
          position: emp.position ?? '',
          isActive: !!emp.isActive,
          userId: emp.userId ? emp.userId : null,
        });
      } else {
        this.form.set({
          fullName: '',
          position: '',
          isActive: true,
          userId: null,
        });
      }
    });
  }

  patchForm(patch: Partial<EmployeeFormPayload>) {
    this.form.update((prev) => ({ ...prev, ...patch }));
  }

  submit() {
    if (!this.isValid()) return;

    const f = this.form();
    this.save.emit({
      ...f,
      fullName: (f.fullName ?? '').trim(),
      position: (f.position ?? '').trim(),
      userId: f.userId ? f.userId : null,
      isActive: !!f.isActive,
    });
  }
}

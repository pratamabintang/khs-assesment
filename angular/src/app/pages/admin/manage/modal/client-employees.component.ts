import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { User } from '../../../../shared/type/user.type';
import { Employee } from '../../../../shared/type/employee.type';

@Component({
  selector: 'app-client-employees-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-40">
        <div class="absolute inset-0 bg-black/60" (click)="close.emit()"></div>

        <div
          class="absolute left-1/2 top-1/2 w-[min(860px,calc(100vw-28px))] -translate-x-1/2 -translate-y-1/2
                 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Pegawai Klien"
        >
          <div
            class="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-fuchsia-600"
          ></div>

          <div
            class="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-4"
          >
            <div class="space-y-0.5">
              <div class="text-sm font-semibold text-slate-900">Pegawai Klien</div>
              <div class="text-xs text-slate-600">Daftar pegawai yang ter-assign ke klien ini.</div>
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
            <!-- Client info card -->
            <div
              class="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div
                class="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50"
                aria-hidden="true"
              ></div>

              <div
                class="relative flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="min-w-0">
                  <div class="text-xs font-semibold text-slate-600">Klien</div>
                  <div class="mt-0.5 truncate text-sm font-semibold text-slate-900">
                    {{ client()?.name ?? '-' }}
                  </div>
                  <div class="mt-0.5 text-xs text-slate-500">
                    ID: <span class="font-medium text-slate-700">{{ client()?.id ?? '-' }}</span>
                  </div>
                </div>

                <div class="mt-2 sm:mt-0">
                  <span
                    class="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                  >
                    Total: {{ employees().length }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Table card -->
            <div
              class="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div class="border-b border-slate-200 bg-slate-50/70 px-5 py-3">
                <div class="grid grid-cols-12 gap-3 text-xs font-semibold text-slate-600">
                  <div class="col-span-6">Nama</div>
                  <div class="col-span-3">Posisi</div>
                  <div class="col-span-2">Aktif</div>
                  <div class="col-span-1 text-right">Aksi</div>
                </div>
              </div>

              @if (employees().length === 0) {
                <div class="p-8">
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
                    <div class="mt-3 text-sm font-semibold text-slate-900">Belum ada pegawai</div>
                    <div class="mt-1 text-xs text-slate-500">Assign pegawai dari tabel klien.</div>
                  </div>
                </div>
              } @else {
                <div class="divide-y divide-slate-100">
                  @for (e of employees(); track e.id) {
                    <div
                      class="group grid grid-cols-12 items-center gap-3 px-5 py-4 hover:bg-indigo-50/60"
                    >
                      <div class="col-span-6 min-w-0">
                        <div class="flex items-start gap-3 min-w-0">
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
                            <div class="truncate text-sm font-semibold text-slate-900">
                              {{ e.fullName }}
                            </div>
                            <div class="mt-1 text-xs text-slate-500">
                              ID: <span class="font-medium text-slate-700">{{ e.id }}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="col-span-3">
                        <span
                          class="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                        >
                          {{ e.position }}
                        </span>
                      </div>

                      <div class="col-span-2">
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
                      </div>

                      <div class="col-span-1 flex justify-end">
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            class="inline-flex items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 shadow-sm
                                   hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-200"
                            (click)="unassign.emit(e)"
                          >
                            Unassign
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <div class="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4">
            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm
                     hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              (click)="close.emit()"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ClientEmployeesModalComponent {
  open = input<boolean>(false);
  client = input<User | null>(null);
  employees = input<Employee[]>([]);

  close = output<void>();
  unassign = output<Employee>();
}

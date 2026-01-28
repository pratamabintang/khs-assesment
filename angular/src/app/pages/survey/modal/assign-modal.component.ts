import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

export type AssignMode = 'client' | 'employee' | 'all';

export type AssignSurveyPayload = {
  surveyId: string;
  mode: AssignMode;
  idClient?: string;
  idEmployee?: string;
};

@Component({
  selector: 'app-assign-survey-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6"
        (click)="close.emit()"
      >
        <div
          class="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
        >
          <div class="p-6 sm:p-7">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="text-xs font-semibold text-slate-500">Assign survey</div>
                <h2 class="mt-1 text-xl font-bold tracking-tight text-slate-900">Assign Survey</h2>
                <div class="mt-2 text-sm text-slate-600">
                  Survey:
                  <span class="font-semibold text-slate-900">{{ surveyTitle || '—' }}</span>
                  <span class="mx-2 text-slate-300">•</span>
                  <span
                    class="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700"
                  >
                    {{ surveyId || '—' }}
                  </span>
                </div>
              </div>

              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                (click)="close.emit()"
                aria-label="Close"
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

            <div class="mt-6 space-y-4">
              <!-- Mode selector -->
              <div class="rounded-2xl border border-slate-200 bg-white p-4">
                <div class="text-xs font-semibold text-slate-700">Target</div>
                <div class="mt-3 grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    class="rounded-2xl border px-3 py-2 text-sm font-semibold transition
                           focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    [class.border-indigo-200]="mode() === 'client'"
                    [class.bg-indigo-50]="mode() === 'client'"
                    [class.text-indigo-700]="mode() === 'client'"
                    [class.border-slate-200]="mode() !== 'client'"
                    [class.bg-white]="mode() !== 'client'"
                    [class.text-slate-700]="mode() !== 'client'"
                    (click)="mode.set('client')"
                  >
                    Ke Client
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl border px-3 py-2 text-sm font-semibold transition
                           focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    [class.border-indigo-200]="mode() === 'employee'"
                    [class.bg-indigo-50]="mode() === 'employee'"
                    [class.text-indigo-700]="mode() === 'employee'"
                    [class.border-slate-200]="mode() !== 'employee'"
                    [class.bg-white]="mode() !== 'employee'"
                    [class.text-slate-700]="mode() !== 'employee'"
                    (click)="mode.set('employee')"
                  >
                    Ke 1 Employee
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl border px-3 py-2 text-sm font-semibold transition
                           focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    [class.border-indigo-200]="mode() === 'all'"
                    [class.bg-indigo-50]="mode() === 'all'"
                    [class.text-indigo-700]="mode() === 'all'"
                    [class.border-slate-200]="mode() !== 'all'"
                    [class.bg-white]="mode() !== 'all'"
                    [class.text-slate-700]="mode() !== 'all'"
                    (click)="mode.set('all')"
                  >
                    Semua Employee
                  </button>
                </div>

                <div class="mt-3 text-[11px] text-slate-500">
                  Pilih salah satu target. Untuk "Semua Employee" tidak perlu input id.
                </div>
              </div>

              <!-- Inputs -->
              @if (mode() === 'client') {
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label class="text-[11px] font-semibold text-slate-600">ID Client</label>
                  <input
                    class="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="contoh: 12"
                    [value]="idClient()"
                    (input)="idClient.set(($any($event.target).value ?? '').toString())"
                  />
                  <div class="mt-1 text-[11px] text-slate-500">
                    Isi id client yang akan menerima survey ini.
                  </div>
                </div>
              }

              @if (mode() === 'employee') {
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label class="text-[11px] font-semibold text-slate-600">ID Employee</label>
                  <input
                    class="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="contoh: 99"
                    [value]="idEmployee()"
                    (input)="idEmployee.set(($any($event.target).value ?? '').toString())"
                  />
                  <div class="mt-1 text-[11px] text-slate-500">
                    Isi id employee yang akan menerima survey ini.
                  </div>
                </div>
              }

              @if (mode() === 'all') {
                <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div class="text-sm font-semibold text-emerald-800">Assign ke semua employee</div>
                  <div class="mt-1 text-sm text-emerald-700">
                    Survey ini akan di-assign ke seluruh employee di database.
                  </div>
                </div>
              }
            </div>

            <!-- Actions -->
            <div class="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700
                       hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                (click)="close.emit()"
              >
                Batal
              </button>

              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow
                       hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-60"
                (click)="submit()"
                [disabled]="!canSubmit()"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class AssignSurveyModalComponent {
  @Input() open = false;

  @Input() surveyId: string | null = null;
  @Input() surveyTitle: string | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<AssignSurveyPayload>();

  mode = signal<AssignMode>('client');
  idClient = signal('');
  idEmployee = signal('');

  canSubmit(): boolean {
    if (!this.surveyId) return false;

    if (this.mode() === 'client') return this.idClient().trim().length > 0;
    if (this.mode() === 'employee') return this.idEmployee().trim().length > 0;
    return true; // all
  }

  submit(): void {
    if (!this.surveyId) return;

    const mode = this.mode();
    const idClient = this.idClient().trim();
    const idEmployee = this.idEmployee().trim();

    this.confirm.emit({
      surveyId: this.surveyId,
      mode,
      idClient: mode === 'client' ? idClient || undefined : undefined,
      idEmployee: mode === 'employee' ? idEmployee || undefined : undefined,
    });
  }
}

// survey-live.page.ts
import { CommonModule, Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, of, switchMap, catchError } from 'rxjs';
import { SurveyDynamicFormComponent } from '../../../survey/survey-dynamic-form';
import { SurveyApiService } from '../../../survey/survey.service';
import { SurveySubmitPayload } from '../../../survey/survey-answer.type';
import { EmployeesService } from '../employees.service';
import { Answer } from '../../../../shared/type/survey-submission/answer.type';
import { Survey } from '../../../../shared/type/survey/survey.type';

type FormMode = 'live' | 'readonly';

@Component({
  selector: 'app-survey-live-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SurveyDynamicFormComponent],
  template: `
    <div class="min-h-dvh bg-slate-50">
      <div class="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
        <!-- Modern Header Card -->
        <div
          class="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50"
            aria-hidden="true"
          ></div>

          <div class="relative p-5 sm:p-6">
            <!-- Top row: back + status -->
            <div class="flex items-center justify-between gap-3">
              <button
                type="button"
                (click)="goBack()"
                class="group inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800
                       shadow-sm transition hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <span
                  class="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white
                         shadow-sm transition group-hover:opacity-95"
                  aria-hidden="true"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M15 18l-6-6 6-6"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                <span>Kembali</span>
              </button>

              <div class="flex items-center gap-2">
                <span
                  class="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                  title="Periode"
                >
                  {{ period() ?? '---' }}
                </span>

                @if (isLive()) {
                  <span
                    class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200"
                    title="Mode"
                  >
                    LIVE
                  </span>
                } @else {
                  <span
                    class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                    title="Mode"
                  >
                    READONLY
                  </span>
                }

                @if (submittedOk()) {
                  <span
                    class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                  >
                    Terkirim ✅
                  </span>
                }
              </div>
            </div>

            <!-- Employee info -->
            @if (selectedEntry()?.employee) {
              <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-sky-500 to-fuchsia-600 text-white shadow-sm"
                    aria-hidden="true"
                  >
                    <span class="text-sm font-bold tracking-wide">
                      {{ initials(selectedEntry()!.employee!.fullName) }}
                    </span>
                  </div>

                  <div class="min-w-0">
                    <div class="truncate text-base font-semibold text-slate-900">
                      {{ selectedEntry()!.employee!.fullName }}
                    </div>
                    <div class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span
                        class="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 font-medium text-slate-700"
                      >
                        {{ selectedEntry()!.employee!.position || '—' }}
                      </span>
                      <span class="text-slate-400">•</span>
                      <span class="truncate">
                        ID:
                        <span class="font-medium text-slate-700">
                          {{ selectedEntry()!.employee!.id }}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  @if (!selectedEntry()!.nosql) {
                    <span
                      class="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200"
                    >
                      <span class="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                      Belum pernah submit
                    </span>
                  } @else {
                    <span
                      class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                    >
                      <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Ada data lama
                    </span>
                  }

                  @if (isLive()) {
                    @if (selectedUpdate()) {
                      <span
                        class="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200"
                      >
                        <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                        Update jawaban
                      </span>
                    } @else {
                      <span
                        class="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200"
                      >
                        <span class="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                        Isi baru
                      </span>
                    }
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Content -->
        @if (loading()) {
          <div
            class="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm"
          >
            Memuat survey…
          </div>
        } @else if (loadError()) {
          <div
            class="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm"
          >
            Gagal memuat survey. Coba refresh / cek ID survey.
          </div>
        } @else {
          @if (isLive()) {
            <app-survey-dynamic-form
              [survey]="survey()"
              [mode]="'live'"
              [initialAnswers]="oldAnswers()"
              (submitted)="onSubmit($event)"
            />
          } @else {
            <app-survey-dynamic-form
              [survey]="survey()"
              [mode]="'readonly'"
              [initialAnswers]="oldAnswers()"
            />
          }
        }

        @if (submitting()) {
          <div
            class="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm"
          >
            Mengirim jawaban…
          </div>
        }
      </div>
    </div>
  `,
})
export class SurveyLivePageComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(SurveyApiService);
  private location = inject(Location);
  private readonly employeesService = inject(EmployeesService);

  selectedEntry = this.employeesService.selectedEntry;
  selectedUpdate = this.employeesService.selectedIsUpdate;

  oldAnswers = signal<Answer[] | null>(null);

  survey = signal<Survey | null>(null);
  loading = signal(true);
  loadError = signal(false);

  submitting = signal(false);
  submittedOk = signal(false);

  // ✅ period dari history.state (Employees -> Survey page)
  period = signal<string | null>(null);

  // ✅ live hanya untuk bulan ini
  isLive = computed<boolean>(() => {
    const p = this.period();
    if (!p) return true; // fallback: anggap live (atau ubah sesuai kebutuhan)
    return p === this.getCurrentPeriod();
  });

  constructor() {
    // 1) pastikan selectedEntry ada (ambil dari history.state kalau refresh / direct)
    if (!this.selectedEntry()) {
      const entry = history.state?.entry ?? null;
      const updateSubmission = !!history.state?.isUpdate;
      if (entry) this.employeesService.setFromEntry(entry, updateSubmission);
    }

    if (!this.selectedEntry()) {
      this.employeesService.clear();
      this.router.navigate(['/user', 'employees'], { replaceUrl: true });
      return;
    }

    // 2) ambil period dari history.state.period
    const p = (history.state?.period ?? '').toString();
    const resolvedPeriod = this.isValidPeriod(p) ? p : this.getCurrentPeriod();
    this.period.set(resolvedPeriod);

    // 3) load old answers kalau ada nosql (baik live maupun readonly, supaya bisa lihat data lama)
    const nosqlId = this.selectedEntry()?.nosql ?? null;
    if (nosqlId) {
      this.employeesService
        .getSurveySubmission(nosqlId)
        .pipe(
          catchError((err) => {
            console.error('Gagal load submission lama', err);
            return of(null);
          }),
        )
        .subscribe((res) => {
          if (!res?.submission?.answers) return;
          this.oldAnswers.set(res.submission.answers);
        });
    }

    // 4) load survey schema
    this.route.paramMap
      .pipe(
        switchMap((pm) => {
          this.loading.set(true);
          this.loadError.set(false);
          this.submittedOk.set(false);

          const id = pm.get('id') ?? '';
          return this.api.getSurvey(id).pipe(finalize(() => this.loading.set(false)));
        }),
      )
      .subscribe({
        next: (s) => this.survey.set(s),
        error: () => {
          this.loadError.set(true);
          this.survey.set(null);
        },
      });
  }

  initials(fullName: string): string {
    const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? '';
    const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (a + b).toUpperCase() || '—';
  }

  goBack(): void {
    // keep period state on back
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/user', 'employees'], { replaceUrl: true });
  }

  onSubmit(payload: SurveySubmitPayload) {
    // ✅ pastikan readonly gak bisa submit
    if (!this.isLive()) return;

    this.submitting.set(true);
    this.submittedOk.set(false);

    payload.entryId = this.selectedEntry()!.id;
    payload.employeeId = this.selectedEntry()!.employeeId;

    const req$ = this.selectedUpdate()
      ? this.api.updateSurvey(this.selectedEntry()?.nosql!, payload)
      : this.api.submitSurvey(payload);

    req$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => {
        this.submittedOk.set(true);
        // balik ke employees, period tetap kepegang lewat history.state (di halaman employees)
        this.router.navigate(['/user', 'employees'], { replaceUrl: true });
      },
      error: () => this.submittedOk.set(false),
    });
  }

  private getCurrentPeriod(): string {
    const d = new Date();
    const yy = d.getFullYear().toString();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${yy}-${mm}`;
  }

  private isValidPeriod(value: string): boolean {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  }
}

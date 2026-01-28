import { CommonModule, Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, finalize, of, switchMap } from 'rxjs';

import { SurveyDynamicFormComponent } from '../../survey/survey-dynamic-form';
import { AdminService } from '../admin.service';
import { SurveyApiService } from '../../survey/survey.service';
import { Answer } from '../../../shared/type/survey-submission/answer.type';
import { Survey } from '../../../shared/type/survey/survey.type';

@Component({
  selector: 'app-admin-survey-view-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SurveyDynamicFormComponent],
  template: `
    <div class="min-h-dvh bg-slate-50">
      <div class="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
        <div
          class="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50"
            aria-hidden="true"
          ></div>

          <div class="relative p-5 sm:p-6">
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
            </div>

            @if (selectedEntry()?.employee) {
              <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-sky-500 to-fuchsia-600 text-white shadow-sm"
                    aria-hidden="true"
                  >
                    <span class="text-sm font-bold tracking-wide">
                      {{ initials(selectedEntry()?.employee?.fullName ?? '') }}
                    </span>
                  </div>

                  <div class="min-w-0">
                    <div class="truncate text-base font-semibold text-slate-900">
                      {{ selectedEntry()?.employee?.fullName ?? '—' }}
                    </div>
                    <div class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span
                        class="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 font-medium text-slate-700"
                      >
                        {{ selectedEntry()?.employee?.position ?? '—' }}
                      </span>
                      <span class="text-slate-400">•</span>
                      <span class="truncate">
                        ID:
                        <span class="font-medium text-slate-700">
                          {{ selectedEntry()?.employee?.id ?? '—' }}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                    Admin • Read-only
                  </span>

                  @if (!selectedEntry()?.nosql) {
                    <span
                      class="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200"
                    >
                      <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                      Belum ada kiriman
                    </span>
                  } @else {
                    <span
                      class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                    >
                      <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Kiriman tersedia
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        </div>

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
        } @else if (!selectedEntry()?.nosql) {
          <div
            class="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm"
          >
            Belum ada jawaban yang tersimpan untuk pegawai ini pada periode tersebut.
          </div>
        } @else if (answersLoading()) {
          <div
            class="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm"
          >
            Memuat jawaban…
          </div>
        } @else if (answersError()) {
          <div
            class="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm"
          >
            Gagal memuat jawaban lama. Coba refresh.
          </div>
        } @else {
          <app-survey-dynamic-form
            [survey]="survey()"
            [mode]="'readonly'"
            [initialAnswers]="oldAnswers()"
          />
        }
      </div>
    </div>
  `,
})
export class AdminSurveyViewPageComponent {
  private readonly adminService = inject(AdminService);
  private readonly api = inject(SurveyApiService);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  selectedEntry = this.adminService.selectedEntry;

  oldAnswers = signal<Answer[] | null>(null);

  survey = signal<Survey | null>(null);
  loading = signal(true);
  loadError = signal(false);

  answersLoading = signal(false);
  answersError = signal(false);

  constructor() {
    if (!this.selectedEntry()) {
      const entryFromState = history.state?.entry ?? null;
      if (entryFromState) this.adminService.setFromEntry(entryFromState);
    }

    const entry = this.selectedEntry();
    if (!entry) {
      this.adminService.clear();
      this.router.navigate(['/admin', 'submission'], { replaceUrl: true });
      return;
    }

    if (entry.nosql) {
      this.answersLoading.set(true);
      this.answersError.set(false);

      this.adminService
        .getSurveySubmission(entry.nosql)
        .pipe(
          finalize(() => this.answersLoading.set(false)),
          catchError((err) => {
            console.error('Gagal load submission', err);
            this.answersError.set(true);
            return of(null);
          }),
        )
        .subscribe((res) => {
          const answers = res?.submission?.answers ?? null;
          this.oldAnswers.set(answers);
        });
    }

    this.route.paramMap
      .pipe(
        switchMap((pm) => {
          this.loading.set(true);
          this.loadError.set(false);

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
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/admin']);
  }
}

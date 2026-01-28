import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, take } from 'rxjs/operators';
import { of } from 'rxjs';

import { SurveyApiService, SurveyListItem } from './survey.service';

import { AssignSurveyModalComponent, AssignSurveyPayload } from './modal/assign-modal.component';

@Component({
  selector: 'app-survey-admin-page',
  standalone: true,
  imports: [CommonModule, AssignSurveyModalComponent],
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
                <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Survey Admin</h1>
                <p class="text-sm text-slate-600">
                  List survey dari backend. Klik Edit untuk membuka builder patch.
                </p>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  (click)="reload()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M4 4a1 1 0 011 1v1.586l1.293-1.293a1 1 0 011.414 1.414L7.414 8H9a1 1 0 110 2H4a1 1 0 01-1-1V4a1 1 0 011-1zm12 12a1 1 0 01-1-1v-1.586l-1.293 1.293a1 1 0 01-1.414-1.414L12.586 12H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 01-1 1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Reload
                </button>
              </div>
            </div>

            <div class="mt-5">
              <label class="sr-only">Search</label>
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
                  class="w-full rounded-2xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Cari judul / deskripsi / id..."
                  [value]="query()"
                  (input)="query.set(($any($event.target).value ?? '').toString())"
                />
              </div>
            </div>
          </div>
        </div>

        @if (loading()) {
          <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            Loading surveys...
          </div>
        }

        @if (errorMsg()) {
          <div class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {{ errorMsg() }}
          </div>
        }

        @if (!loading() && !errorMsg()) {
          <div class="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 bg-slate-50/70 px-4 py-3">
              <div class="grid grid-cols-12 gap-3 text-xs font-semibold text-slate-600">
                <div class="col-span-7">Survey</div>
                <div class="col-span-3">Updated</div>
                <div class="col-span-2 text-right">Action</div>
              </div>
            </div>

            @if (filteredSurveys().length === 0) {
              <div class="p-6 text-sm text-slate-600">Tidak ada survey yang cocok.</div>
            }

            @for (s of filteredSurveys(); track s.id) {
              <div class="border-b border-slate-100 px-4 py-4">
                <div class="grid grid-cols-12 items-start gap-3">
                  <div class="col-span-7">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <div class="truncate text-sm font-semibold text-slate-900">
                          {{ s.title }}
                        </div>
                        <div class="mt-1 line-clamp-2 text-sm text-slate-600">
                          {{ s.description || '—' }}
                        </div>
                      </div>

                      <span
                        class="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
                      >
                        {{ s.id }}
                      </span>
                    </div>
                  </div>

                  <div class="col-span-3 text-sm text-slate-600">
                    {{ formatDate(s.updatedAt) }}
                  </div>

                  <div class="col-span-2 flex justify-end gap-2">
                    <button
                      type="button"
                      class="rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                      (click)="openAssignModal(s)"
                    >
                      Assign
                    </button>

                    <button
                      type="button"
                      class="rounded-2xl border border-slate-400 bg-red-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-red-100"
                      (click)="onDelete(s)"
                    >
                      Soft Delete
                    </button>

                    <!-- <button      edit tidak dipakai. biarkan tetap ada suatu saat diperlukan
                      type="button"
                      class="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                      (click)="onEdit(s)"
                    >
                      Edit
                    </button> -->
                  </div>
                </div>

                <div class="mt-2 text-xs text-slate-500">
                  Created:
                  <span class="font-medium text-slate-700">{{ formatDate(s.createdAt) }}</span>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <button
        type="button"
        class="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        (click)="onCreateSurvey()"
      >
        <span class="text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clip-rule="evenodd"
            />
          </svg>
        </span>
        Create Survey
      </button>

      <app-assign-survey-modal
        [open]="assignOpen()"
        [surveyId]="selectedSurveyId()"
        [surveyTitle]="selectedSurveyTitle()"
        (close)="closeAssignModal()"
        (confirm)="onAssignConfirm($event)"
      />
    </div>
  `,
})
export class SurveyPageComponent {
  private router = inject(Router);
  private api = inject(SurveyApiService);

  query = signal('');
  loading = signal(true);
  errorMsg = signal<string | null>(null);

  surveys = signal<SurveyListItem[]>([]);

  assignOpen = signal(false);
  selectedSurveyId = signal<string | null>(null);
  selectedSurveyTitle = signal<string | null>(null);

  constructor() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.errorMsg.set(null);

    this.api
      .listSurveys()
      .pipe(
        catchError((err) => {
          this.errorMsg.set('Gagal load surveys. Cek network / backend.');
          console.error(err);
          return of([] as SurveyListItem[]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((list) => this.surveys.set(list ?? []));
  }

  reload() {
    this.load();
  }

  filteredSurveys = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.surveys();

    return list.filter((s) => {
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  });

  formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString();
  }

  onDelete(s: SurveyListItem) {
    if (!confirm(`Hapus survey "${s.title}"?`)) return;

    this.loading.set(true);
    this.api
      .softDeleteSurvey(s.id)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          console.error(err);
          this.errorMsg.set('Gagal delete survey.');
          return of(void 0);
        }),
      )
      .subscribe(() => this.reload());
  }

  // onEdit(s: SurveyListItem) { biarkan saja jangan dihapus
  //   this.router.navigate(['/admin/survey/builder', s.id]);
  // }

  onCreateSurvey() {
    this.router.navigate(['admin', 'survey', 'builder']);
  }

  openAssignModal(s: SurveyListItem): void {
    this.selectedSurveyId.set(s.id);
    this.selectedSurveyTitle.set(s.title);
    this.assignOpen.set(true);
  }

  closeAssignModal(): void {
    this.assignOpen.set(false);
    this.selectedSurveyId.set(null);
    this.selectedSurveyTitle.set(null);
  }

  onAssignConfirm(payload: AssignSurveyPayload): void {
    this.closeAssignModal();

    this.loading.set(true);
    this.api
      .assignSurvey(payload)
      .pipe(
        take(1),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: () => {},
        error: (err) => {
          console.warn(err);
        },
      });
  }
}

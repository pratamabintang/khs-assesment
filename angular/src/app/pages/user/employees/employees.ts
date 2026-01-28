import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, finalize, of } from 'rxjs';
import { Router } from '@angular/router';
import { EmployeesService } from './employees.service';
import { SurveySubmissionEntry } from '../../../shared/type/survey-submission/survey-submission-entry.type';
import { DownloadService } from '../../../shared/download/download.service';

type SortKey = 'fullName' | 'position';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-modern-list-table',
  standalone: true,
  imports: [CommonModule],
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
                <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Daftar Pegawai</h1>
                <p class="text-sm text-slate-600">
                  Klik baris untuk membuka halaman pengisian survey bulan ini.
                </p>
              </div>

              <div class="flex flex-col gap-3 sm:items-end">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-semibold text-slate-600">Periode:</span>

                  <div class="relative">
                    <select
                      class="h-9 appearance-none rounded-2xl border border-slate-200 bg-white/80 pl-3 pr-9 text-sm font-semibold text-slate-800 shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      [value]="selectedMonth()"
                      (change)="onMonthChange(($any($event.target).value ?? '').toString())"
                      aria-label="Pilih bulan"
                    >
                      <option value="---" disabled>---</option>

                      @for (m of months; track m.value) {
                        <option [value]="m.value">{{ m.label }}</option>
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

                  <div class="relative">
                    <select
                      class="h-9 appearance-none rounded-2xl border border-slate-200 bg-white/80 pl-3 pr-9 text-sm font-semibold text-slate-800 shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      [value]="selectedYear()"
                      (change)="onYearChange(($any($event.target).value ?? '').toString())"
                      aria-label="Pilih tahun"
                    >
                      <option value="---" disabled>---</option>

                      @for (y of years(); track y) {
                        <option [value]="y">{{ y }}</option>
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

                  <span
                    class="ml-1 inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                    title="Query key"
                  >
                    {{ activePeriod() ?? '---' }}
                  </span>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                    Sudah isi
                  </span>
                  <span
                    class="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    Belum isi
                  </span>
                </div>
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
                  class="w-full rounded-2xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Cari berdasarkan nama..."
                  [value]="searchText"
                  (input)="onSearch(($any($event.target).value ?? '').toString())"
                />

                @if (searchText.trim().length > 0) {
                  <button
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400
                           hover:bg-slate-100 hover:text-slate-700"
                    (click)="clearSearch()"
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
                }
              </div>

              <div
                class="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"
              >
                <div>
                  Total data:
                  <span class="font-semibold text-slate-700">{{ rows().length }}</span>
                </div>
                <div
                  class="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 ring-1 ring-slate-200"
                >
                  <span>Sort:</span>
                  <span class="font-semibold text-slate-700">
                    {{ sortKey === 'fullName' ? 'Nama' : 'Posisi' }}
                  </span>
                  <span class="text-slate-400">•</span>
                  <span class="font-medium text-slate-700">{{
                    sortDir === 'asc' ? 'A–Z' : 'Z–A'
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div
            class="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-fuchsia-600"
          ></div>

          @if (loading()) {
            <div class="p-6 text-sm text-slate-600">
              <div class="flex items-center gap-3">
                <span
                  class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500"
                ></span>
                <span>Memuat data…</span>
              </div>
            </div>
          } @else if (filteredRows().length === 0) {
            <div class="p-8">
              <div
                class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"
              >
                <div
                  class="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-slate-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      d="M3 4a2 2 0 012-2h6a2 2 0 012 2v2h2a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V4z"
                    />
                  </svg>
                </div>
                <div class="mt-3 text-sm font-semibold text-slate-900">Data tidak ditemukan</div>
                <div class="mt-1 text-xs text-slate-500">Coba ubah kata kunci pencarian.</div>
              </div>
            </div>
          } @else {
            <!-- Header row -->
            <div class="border-b border-slate-200 bg-slate-50/70 px-4 py-3">
              <div class="grid grid-cols-12 gap-3 text-xs font-semibold text-slate-600">
                <div class="col-span-2 sm:col-span-1">No</div>

                <div class="col-span-7 sm:col-span-6">
                  <button
                    type="button"
                    class="group inline-flex items-center gap-2 hover:text-slate-900"
                    (click)="toggleSort('fullName')"
                    [attr.aria-sort]="ariaSort('fullName')"
                  >
                    Nama
                    <span
                      class="inline-flex h-6 w-6 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400
                                 group-hover:bg-slate-100 group-hover:text-slate-700"
                      aria-hidden="true"
                    >
                      @if (sortKey === 'fullName') {
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
                          @if (sortDir === 'asc') {
                            <path d="M12 6l-4 4h8l-4-4z" fill="currentColor"></path>
                          } @else {
                            <path d="M12 18l4-4H8l4 4z" fill="currentColor"></path>
                          }
                        </svg>
                      } @else {
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M8 10l4-4 4 4H8zM16 14l-4 4-4-4h8z"
                            fill="currentColor"
                            opacity="0.6"
                          ></path>
                        </svg>
                      }
                    </span>
                  </button>
                </div>

                <div class="col-span-3 sm:col-span-4">
                  <button
                    type="button"
                    class="group inline-flex items-center gap-2 hover:text-slate-900"
                    (click)="toggleSort('position')"
                    [attr.aria-sort]="ariaSort('position')"
                  >
                    Posisi
                    <span
                      class="inline-flex h-6 w-6 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400
                                 group-hover:bg-slate-100 group-hover:text-slate-700"
                      aria-hidden="true"
                    >
                      @if (sortKey === 'position') {
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
                          @if (sortDir === 'asc') {
                            <path d="M12 6l-4 4h8l-4-4z" fill="currentColor"></path>
                          } @else {
                            <path d="M12 18l4-4H8l4 4z" fill="currentColor"></path>
                          }
                        </svg>
                      } @else {
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M8 10l4-4 4 4H8zM16 14l-4 4-4-4h8z"
                            fill="currentColor"
                            opacity="0.6"
                          ></path>
                        </svg>
                      }
                    </span>
                  </button>
                </div>

                <div class="col-span-0 sm:col-span-1 text-right"></div>
              </div>
            </div>

            <div class="divide-y divide-slate-100">
              @for (row of filteredRows(); track row.id) {
                <div
                  (click)="onRowClick(row)"
                  class="group relative grid grid-cols-12 items-center gap-3 px-4 py-4 transition hover:bg-indigo-50/60 cursor-pointer"
                  [class.bg-amber-50]="!row.nosql"
                  [class.hover:bg-amber-100/60]="!row.nosql"
                  role="button"
                  tabindex="0"
                >
                  <div
                    class="pointer-events-none absolute inset-y-0 left-0 w-1 opacity-0 transition group-hover:opacity-100
                           bg-gradient-to-b from-indigo-600 via-sky-500 to-fuchsia-600"
                    [class.from-amber-500]="!row.nosql"
                    [class.via-amber-400]="!row.nosql"
                    [class.to-amber-300]="!row.nosql"
                  ></div>

                  <div class="col-span-2 sm:col-span-1">
                    <span
                      class="inline-flex h-8 min-w-[2.25rem] items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                      [class.bg-amber-100]="!row.nosql"
                      [class.text-amber-800]="!row.nosql"
                      [class.ring-amber-200]="!row.nosql"
                    >
                      {{ $index + 1 }}
                    </span>
                  </div>

                  <div class="col-span-7 sm:col-span-6 min-w-0">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="min-w-0">
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="truncate text-sm font-semibold text-slate-900">
                            {{ row.employee!.fullName }}
                          </span>

                          @if (!row.nosql) {
                            <span
                              class="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200"
                            >
                              Belum isi
                            </span>
                          } @else {
                            <span
                              class="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200"
                            >
                              Sudah isi
                            </span>
                          }
                        </div>
                        <div class="mt-1 text-xs text-slate-500">
                          ID: <span class="font-medium text-slate-700">{{ row.employee!.id }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="col-span-3 sm:col-span-4 flex items-center justify-between gap-3">
                    <span
                      class="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                      [class.border-amber-200]="!row.nosql"
                      [class.bg-amber-50]="!row.nosql"
                      [class.text-amber-800]="!row.nosql"
                    >
                      {{ row.employee!.position }}
                    </span>

                    @if (row.nosql) {
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm
                               hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        (click)="onDownloadClick($event, row)"
                        aria-label="Download"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M12 3v10"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M8 11l4 4 4-4"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M5 21h14"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                        </svg>
                        Download
                      </button>
                    }
                  </div>

                  <div class="col-span-0 sm:col-span-1 flex justify-end">
                    <span
                      class="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition
                             group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700"
                      [class.border-amber-200]="!row.nosql"
                      [class.bg-amber-50]="!row.nosql"
                      [class.text-amber-700]="!row.nosql"
                      aria-hidden="true"
                    >
                      <svg
                        class="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M9 18L15 12L9 6"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              }
            </div>

            <div class="border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-500">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  Menampilkan
                  <span class="font-semibold text-slate-700">{{ filteredRows().length }}</span>
                  dari
                  <span class="font-semibold text-slate-700">{{ rows().length }}</span>
                  data
                </div>
                <div class="inline-flex items-center gap-2">
                  <span class="text-slate-500">Klik baris untuk mengisi survey.</span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <button
        type="button"
        class="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600
               px-4 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
  `,
})
export class EmployeesComponent implements OnInit {
  private readonly employeesService = inject(EmployeesService);
  private readonly downloadService = inject(DownloadService);
  private readonly router = inject(Router);

  loading = signal<boolean>(false);

  rows = signal<SurveySubmissionEntry[]>([]);
  filteredRows = signal<SurveySubmissionEntry[]>([]);

  searchText = '';
  sortKey: SortKey = 'fullName';
  sortDir: SortDir = 'asc';

  months = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ] as const;

  years = signal<string[]>(this.buildYears());

  selectedMonth = signal<string>('---');
  selectedYear = signal<string>('---');

  activePeriod = signal<string | null>(null);

  ngOnInit(): void {
    const persisted = this.readPeriodFromHistoryState();
    const initial = persisted ?? this.buildPeriod(this.getCurrentYear(), this.getCurrentMonth());

    this.activePeriod.set(initial);
    this.persistPeriodToHistoryState(initial);
    this.load(initial);
  }

  reload(): void {
    const p = this.activePeriod();
    if (!p) return;
    this.persistPeriodToHistoryState(p);
    this.load(p);
  }

  private load(period: string): void {
    this.loading.set(true);
    this.employeesService
      .getAllSurveySubmissionEntry(period)
      .pipe(
        catchError((err) => {
          console.error(err);
          return of([] as SurveySubmissionEntry[]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((entry) => {
        this.rows.set(entry ?? []);
        this.applyFilterSort();
      });
  }

  onMonthChange(month: string): void {
    this.selectedMonth.set(month);
    this.tryUpdateActivePeriodFromSelect();
  }

  onYearChange(year: string): void {
    this.selectedYear.set(year);
    this.tryUpdateActivePeriodFromSelect();
  }

  private tryUpdateActivePeriodFromSelect(): void {
    const y = this.selectedYear();
    const m = this.selectedMonth();

    if (!this.isValidYear(y) || !this.isValidMonth(m)) return;

    const p = this.buildPeriod(y, m);
    this.activePeriod.set(p);

    this.persistPeriodToHistoryState(p);

    this.load(p);
  }

  onDownloadClick(event: MouseEvent, row: SurveySubmissionEntry): void {
    event.stopPropagation();
    event.preventDefault();

    if (!row.nosql) return;

    this.downloadService.downloadPdf(row.nosql).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `penilaian_${row.nosql}.pdf`;
        a.click();

        setTimeout(() => URL.revokeObjectURL(url), 3000);
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  onRowClick(row: SurveySubmissionEntry): void {
    const p = this.activePeriod();
    if (!p) return;

    this.employeesService
      .isUpdate(row)
      .pipe(catchError(() => of(false)))
      .subscribe((isUpdate) => {
        this.employeesService.setFromEntry(row, isUpdate);
        this.router.navigate(['/user', 'submission', row.surveyId], {
          state: { entry: row, isUpdate, period: p },
        });
      });
  }

  onSearch(value: string): void {
    this.searchText = value;
    this.applyFilterSort();
  }

  clearSearch(): void {
    this.searchText = '';
    this.applyFilterSort();
  }

  toggleSort(key: SortKey): void {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.applyFilterSort();
  }

  ariaSort(key: SortKey): 'none' | 'ascending' | 'descending' {
    if (this.sortKey !== key) return 'none';
    return this.sortDir === 'asc' ? 'ascending' : 'descending';
  }

  private applyFilterSort(): void {
    const q = this.searchText.trim().toLowerCase();

    const filtered = q
      ? this.rows().filter((r) => (r.employee!.fullName ?? '').toLowerCase().includes(q))
      : [...this.rows()];

    const dir = this.sortDir === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      const av = (a.employee![this.sortKey] ?? '').toString().toLowerCase();
      const bv = (b.employee![this.sortKey] ?? '').toString().toLowerCase();
      return av.localeCompare(bv) * dir;
    });

    this.filteredRows.set(filtered);
  }

  private getCurrentMonth(): string {
    const d = new Date();
    return (d.getMonth() + 1).toString().padStart(2, '0');
  }

  private getCurrentYear(): string {
    return new Date().getFullYear().toString();
  }

  private buildYears(): string[] {
    const y = new Date().getFullYear();
    const years: string[] = [];
    for (let i = y; i >= y - 5; i--) years.push(i.toString());
    return years;
  }

  private buildPeriod(year: string, month: string): string {
    const yy = (year ?? '').toString().padStart(4, '0');
    const mm = (month ?? '').toString().padStart(2, '0');
    return `${yy}-${mm}`;
  }

  private isValidMonth(value: string): boolean {
    return /^(0[1-9]|1[0-2])$/.test(value);
  }

  private isValidYear(value: string): boolean {
    return /^\d{4}$/.test(value);
  }

  private readPeriodFromHistoryState(): string | null {
    const p = (history.state?.period ?? '').toString();
    return this.isValidPeriod(p) ? p : null;
  }

  private persistPeriodToHistoryState(period: string): void {
    const nextState = { ...(history.state ?? {}), period };
    history.replaceState(nextState, '', this.router.url);
  }

  private isValidPeriod(value: string): boolean {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  }
}

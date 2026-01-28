import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonthPickerModalComponent, MonthValue } from './modal/month-picker';
import { AdminService } from '../admin.service';
import { Router } from '@angular/router';
import { SurveySubmissionEntry } from '../../../shared/type/survey-submission/survey-submission-entry.type';
import { DownloadService } from '../../../shared/download/download.service';
import { finalize, take } from 'rxjs/operators';
import {
  DownloadAllModalComponent,
  DownloadAllPayload,
} from './modal/download-all-modal.component';

type SortKey = 'fullName' | 'position' | 'companyName';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-admin-submission-list-preview',
  standalone: true,
  imports: [CommonModule, MonthPickerModalComponent, DownloadAllModalComponent],
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
                <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
                  Admin • Monitoring Penilaian Bulanan
                </h1>
                <p class="text-sm text-slate-600">
                  Filter bulan dibuat khusus (rentang) dan filter perusahaan menyatu dengan
                  pencarian.
                </p>

                @if (isLoading()) {
                  <div
                    class="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-600"
                  >
                    <span class="h-2 w-2 animate-pulse rounded-full bg-indigo-500"></span>
                    Memuat data...
                  </div>
                }
              </div>

              <div class="flex flex-col items-end gap-3">
                <!-- Download all (OPEN MODAL) -->
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm
                         hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-60"
                  (click)="openDownloadAllModal()"
                  [disabled]="isLoading()"
                >
                  <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
                    <path
                      d="M12 3v10m0 0l4-4m-4 4l-4-4M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Unduh Semua
                </button>

                <!-- Legend -->
                <div class="flex flex-wrap items-center justify-end gap-2">
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

            <!-- Month Range Buttons -->
            <div class="mt-5 grid gap-3 sm:grid-cols-2">
              <!-- From -->
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-xs font-semibold text-slate-700">Bulan dari</div>
                    <div class="mt-1 text-[11px] text-slate-500">
                      Klik tombol untuk pilih bulan (bukan input text).
                    </div>
                  </div>

                  <button
                    type="button"
                    class="group inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm
                           hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                    (click)="openMonthPicker('from')"
                    [disabled]="isLoading()"
                  >
                    <span
                      class="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                    >
                      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
                        <path
                          d="M8 7V5m8 2V5M7 11h10M6 21h12a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                    <span class="flex flex-col items-start leading-tight">
                      <span class="text-[11px] font-medium text-slate-500">Mulai</span>
                      <span class="tracking-tight">{{ formatMonth(monthFrom()) }}</span>
                    </span>
                    <span
                      class="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400
                             group-hover:bg-slate-100 group-hover:text-slate-700"
                      aria-hidden="true"
                    >
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 18L15 12L9 6"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>

              <!-- To -->
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-xs font-semibold text-slate-700">Bulan sampai</div>
                    <div class="mt-1 text-[11px] text-slate-500">
                      Rentang bulan akan memfilter data preview.
                    </div>
                  </div>

                  <button
                    type="button"
                    class="group inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm
                           hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                    (click)="openMonthPicker('to')"
                    [disabled]="isLoading()"
                  >
                    <span
                      class="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-100"
                    >
                      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
                        <path
                          d="M8 7V5m8 2V5M7 11h10M6 21h12a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                    <span class="flex flex-col items-start leading-tight">
                      <span class="text-[11px] font-medium text-slate-500">Sampai</span>
                      <span class="tracking-tight">{{ formatMonth(monthTo()) }}</span>
                    </span>
                    <span
                      class="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400
                             group-hover:bg-slate-100 group-hover:text-slate-700"
                      aria-hidden="true"
                    >
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 18L15 12L9 6"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Search bar -->
            <div class="mt-4">
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
                         focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                  placeholder="Cari nama pegawai / posisi / perusahaan..."
                  [value]="searchText"
                  (input)="onSearch(($any($event.target).value ?? '').toString())"
                  [disabled]="isLoading()"
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
            </div>
          </div>
        </div>

        <!-- TABLE -->
        <div class="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div
            class="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-fuchsia-600"
          ></div>

          <div class="border-b border-slate-100 bg-white/70 px-4 py-3">
            <div class="grid grid-cols-12 items-center gap-3">
              <div class="col-span-2 sm:col-span-1">
                <span class="text-[11px] font-semibold text-slate-500">#</span>
              </div>

              <div class="col-span-4 sm:col-span-4 min-w-0">
                <button
                  type="button"
                  class="group inline-flex items-center gap-2 rounded-xl px-2 py-1 text-left text-[11px] font-semibold text-slate-600
                         hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  (click)="toggleSort('fullName')"
                  [attr.aria-sort]="ariaSort('fullName')"
                >
                  Nama
                  <span class="text-slate-400 group-hover:text-slate-700">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      @if (sortKey === 'fullName') {
                        @if (sortDir === 'asc') {
                          <path
                            d="M7 14l5-5 5 5"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        } @else {
                          <path
                            d="M7 10l5 5 5-5"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        }
                      } @else {
                        <path
                          d="M8 10l4-4 4 4M8 14l4 4 4-4"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      }
                    </svg>
                  </span>
                </button>
              </div>

              <div class="col-span-3 sm:col-span-3">
                <button
                  type="button"
                  class="group inline-flex items-center gap-2 rounded-xl px-2 py-1 text-left text-[11px] font-semibold text-slate-600
                         hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  (click)="toggleSort('position')"
                  [attr.aria-sort]="ariaSort('position')"
                >
                  Posisi
                  <span class="text-slate-400 group-hover:text-slate-700">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      @if (sortKey === 'position') {
                        @if (sortDir === 'asc') {
                          <path
                            d="M7 14l5-5 5 5"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        } @else {
                          <path
                            d="M7 10l5 5 5-5"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        }
                      } @else {
                        <path
                          d="M8 10l4-4 4 4M8 14l4 4 4-4"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      }
                    </svg>
                  </span>
                </button>
              </div>

              <div class="col-span-4 sm:col-span-3 min-w-0">
                <button
                  type="button"
                  class="group inline-flex items-center gap-2 rounded-xl px-2 py-1 text-left text-[11px] font-semibold text-slate-600
                         hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  (click)="toggleSort('companyName')"
                  [attr.aria-sort]="ariaSort('companyName')"
                >
                  Perusahaan
                  <span class="text-slate-400 group-hover:text-slate-700">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      @if (sortKey === 'companyName') {
                        @if (sortDir === 'asc') {
                          <path
                            d="M7 14l5-5 5 5"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        } @else {
                          <path
                            d="M7 10l5 5 5-5"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        }
                      } @else {
                        <path
                          d="M8 10l4-4 4 4M8 14l4 4 4-4"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      }
                    </svg>
                  </span>
                </button>
              </div>

              <div class="col-span-0 sm:col-span-1"></div>
            </div>

            <div class="mt-2 text-[11px] text-slate-500">
              Urutkan:
              <span class="font-semibold text-slate-700">{{ sortLabel() }}</span>
              <span class="mx-1">•</span>
              <span class="font-semibold text-slate-700">{{
                sortDir === 'asc' ? 'A → Z' : 'Z → A'
              }}</span>
            </div>
          </div>

          @if (filteredRows().length === 0) {
            <div class="p-8">
              <div
                class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"
              >
                <div class="mt-3 text-sm font-semibold text-slate-900">Data tidak ditemukan</div>
                <div class="mt-1 text-xs text-slate-500">
                  Coba ubah rentang bulan atau pencarian.
                </div>
              </div>
            </div>
          } @else {
            <div class="divide-y divide-slate-100">
              @for (row of filteredRows(); track row.id) {
                <div
                  class="group relative grid grid-cols-12 items-center gap-3 px-4 py-4 transition hover:bg-indigo-50/60 cursor-pointer"
                  [class.bg-amber-50]="!row.nosql"
                  [class.hover:bg-amber-100/60]="!row.nosql"
                  role="button"
                  tabindex="0"
                  (click)="onRowClick(row)"
                  (keydown.enter)="onRowClick(row)"
                  (keydown.space)="onRowClick(row); $event.preventDefault()"
                >
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

                  <div class="col-span-4 sm:col-span-4 min-w-0">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="truncate text-sm font-semibold text-slate-900">
                        {{ row.employee?.fullName ?? '—' }}
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
                  </div>

                  <div class="col-span-3 sm:col-span-3">
                    <span
                      class="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                      [class.border-amber-200]="!row.nosql"
                      [class.bg-amber-50]="!row.nosql"
                      [class.text-amber-800]="!row.nosql"
                    >
                      {{ row.employee?.position ?? '—' }}
                    </span>
                  </div>

                  <div class="col-span-4 sm:col-span-3 min-w-0">
                    <span
                      class="inline-flex max-w-full items-center rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                      [class.border-amber-200]="!row.nosql"
                      [class.bg-amber-50]="!row.nosql"
                      [class.text-amber-800]="!row.nosql"
                      [title]="rowCompanyName(row)"
                    >
                      <span class="truncate">{{ rowCompanyName(row) }}</span>
                    </span>
                  </div>

                  <div class="col-span-0 sm:col-span-1 flex justify-end">
                    <div class="flex items-center gap-2">
                      @if (row.nosql) {
                        <button
                          type="button"
                          class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm
                                 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          (click)="onDownloadRowClick($event, row)"
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

                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm
                                 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        (click)="onDeleteRowClick($event, row)"
                        aria-label="Delete"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M4 7h16"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M10 11v6"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M14 11v6"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <path
                            d="M6 7l1 14h10l1-14"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M9 7V4h6v3"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>

            <div class="border-t border-slate-100 bg-white/70 px-4 py-3">
              <div
                class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500"
              >
                <div class="inline-flex items-center gap-2">
                  <span>
                    Menampilkan
                    <span class="font-semibold text-slate-700">{{ filteredRows().length }}</span>
                    data
                  </span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <app-month-picker-modal
        [open]="pickerOpen()"
        [targetLabel]="pickerTarget() === 'from' ? 'Bulan dari' : 'Bulan sampai'"
        [selectedMonth]="pickerTarget() === 'from' ? monthFrom() : monthTo()"
        [initialYear]="pickerYear()"
        (close)="closeMonthPicker()"
        (select)="onMonthSelected($event)"
      />

      <!-- ✅ Download All Modal -->
      <app-download-all-modal
        [open]="downloadAllOpen()"
        [from]="rangeFromDate()"
        [to]="rangeToDate()"
        [fromLabel]="formatMonth(monthFrom())"
        [toLabel]="formatMonth(monthTo())"
        (close)="closeDownloadAllModal()"
        (confirm)="onDownloadAllConfirm($event)"
      />
    </div>
  `,
})
export class AdminSubmissionListComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly downloadService = inject(DownloadService);
  private readonly router = inject(Router);

  rows = signal<SurveySubmissionEntry[]>([]);
  filteredRows = signal<SurveySubmissionEntry[]>([]);
  isLoading = signal(false);

  searchText = '';
  sortKey: SortKey = 'fullName';
  sortDir: SortDir = 'asc';

  monthFrom = signal<MonthValue>(this.defaultMonth());
  monthTo = signal<MonthValue>(this.defaultMonth());

  pickerOpen = signal(false);
  pickerTarget = signal<'from' | 'to'>('from');
  pickerYear = signal<number>(new Date().getFullYear());

  downloadAllOpen = signal(false);

  ngOnInit(): void {
    this.load();
    this.applyAll();
  }

  rangeFromDate(): string {
    return this.monthFrom() + '-01';
  }

  rangeToDate(): string {
    return this.monthTo() + '-01';
  }

  openDownloadAllModal(): void {
    this.downloadAllOpen.set(true);
  }

  closeDownloadAllModal(): void {
    this.downloadAllOpen.set(false);
  }

  onDownloadAllConfirm(payload: DownloadAllPayload): void {
    this.closeDownloadAllModal();

    const ids: string[] = this.rows()
      .filter((row) => {
        const inRange = row.periodMonth >= payload.from && row.periodMonth <= payload.to;
        const matchClient = payload.idClient ? row.userId === payload.idClient : true;
        const matchEmployee = payload.idEmployee ? row.employeeId === payload.idEmployee : true;
        const hasNosql = row.nosql != null && row.nosql !== '';

        return inRange && matchClient && matchEmployee && hasNosql;
      })
      .map((row) => row.nosql!);

    if (ids.length === 0) {
      console.warn('Tidak ada data untuk di download');
    }

    this.downloadService
      .downloadBulkZip({ submissionIds: ids })
      .subscribe({ error: (err) => console.error(err) });
  }

  load(): void {
    const from = this.rangeFromDate();
    const to = this.rangeToDate();

    this.isLoading.set(true);

    this.adminService
      .getAllAdmin(from, to)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.rows.set(res);
          this.applyAll();
        },
        error: (err) => console.error('[getAllAdmin] error', err),
      });
  }

  onRowClick(row: SurveySubmissionEntry): void {
    this.adminService.setFromEntry(row);
    this.router.navigate(['/admin', 'submission', row.surveyId], {
      state: { entry: row },
    });
  }

  onDownloadRowClick(event: MouseEvent, row: SurveySubmissionEntry): void {
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
      error: (err) => console.error(err),
    });
  }

  onDeleteRowClick(event: MouseEvent, row: SurveySubmissionEntry): void {
    event.stopPropagation();
    event.preventDefault();

    if (!confirm(`Hapus survey "${row.id}"?`)) return;

    this.adminService
      .removeEntry(row.id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.rows.update((oldRow) => oldRow.filter((r) => r.id !== row.id));
          this.applyAll();
        },
        error: (err) => {
          console.warn(err);
        },
      });
  }

  openMonthPicker(target: 'from' | 'to'): void {
    this.pickerTarget.set(target);
    const base = target === 'from' ? this.monthFrom() : this.monthTo();
    this.pickerYear.set(parseInt(base.slice(0, 4), 10));
    this.pickerOpen.set(true);
  }

  closeMonthPicker(): void {
    this.pickerOpen.set(false);
    console.log('[MONTH RANGE]', { from: this.monthFrom(), to: this.monthTo() });
  }

  onMonthSelected(month: MonthValue): void {
    if (this.pickerTarget() === 'from') {
      this.monthFrom.set(month);
      if (this.monthFrom() > this.monthTo()) this.monthTo.set(month);
    } else {
      this.monthTo.set(month);
      if (this.monthTo() < this.monthFrom()) this.monthFrom.set(month);
    }

    this.closeMonthPicker();
    this.load();
  }

  onSearch(v: string): void {
    this.searchText = v;
    this.applyAll();
  }

  clearSearch(): void {
    this.searchText = '';
    this.applyAll();
  }

  toggleSort(key: SortKey): void {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.applyAll();
  }

  ariaSort(key: SortKey): 'none' | 'ascending' | 'descending' {
    if (this.sortKey !== key) return 'none';
    return this.sortDir === 'asc' ? 'ascending' : 'descending';
  }

  sortLabel(): string {
    if (this.sortKey === 'fullName') return 'Nama';
    if (this.sortKey === 'position') return 'Posisi';
    return 'Perusahaan';
  }

  rowCompanyName(row: SurveySubmissionEntry): string {
    return (row.user?.name ?? '—').toString();
  }

  private applyAll(): void {
    const q = this.searchText.trim().toLowerCase();

    let data = [...this.rows()];

    if (q) {
      data = data.filter((r) => {
        const name = (r.employee?.fullName ?? '').toLowerCase();
        const pos = (r.employee?.position ?? '').toLowerCase();
        const comp = (r.user?.name ?? '').toLowerCase();
        return name.includes(q) || pos.includes(q) || comp.includes(q);
      });
    }

    const dir = this.sortDir === 'asc' ? 1 : -1;
    data.sort((a, b) => {
      const av = this.getSortValue(a, this.sortKey);
      const bv = this.getSortValue(b, this.sortKey);
      return av.localeCompare(bv) * dir;
    });

    this.filteredRows.set(data);
  }

  private getSortValue(row: SurveySubmissionEntry, key: SortKey): string {
    if (key === 'companyName') return (row.user?.name ?? '').toLowerCase();
    if (key === 'position') return (row.employee?.position ?? '').toLowerCase();
    return (row.employee?.fullName ?? '').toLowerCase();
  }

  formatMonth(ym: MonthValue): string {
    const year = ym.slice(0, 4);
    const m = ym.slice(5, 7);
    const monthName =
      m === '01'
        ? 'Jan'
        : m === '02'
          ? 'Feb'
          : m === '03'
            ? 'Mar'
            : m === '04'
              ? 'Apr'
              : m === '05'
                ? 'Mei'
                : m === '06'
                  ? 'Jun'
                  : m === '07'
                    ? 'Jul'
                    : m === '08'
                      ? 'Agu'
                      : m === '09'
                        ? 'Sep'
                        : m === '10'
                          ? 'Okt'
                          : m === '11'
                            ? 'Nov'
                            : 'Des';
    return `${monthName} ${year}`;
  }

  private defaultMonth(): MonthValue {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
}

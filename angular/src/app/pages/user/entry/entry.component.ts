import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, finalize, of } from 'rxjs';
import { Router } from '@angular/router';
import { EntryService } from './entry.service';
import { Entry } from '../../../shared/type/survey-submission/entry.type';
import { DownloadService } from '../../../shared/download/download.service';

type SortKey = 'fullName' | 'position';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-modern-list-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entry.template.html',
})
export class EntryComponent implements OnInit {
  private readonly entryService = inject(EntryService);
  private readonly downloadService = inject(DownloadService);
  private readonly router = inject(Router);

  loading = signal<boolean>(false);

  rows = signal<Entry[]>([]);
  filteredRows = signal<Entry[]>([]);

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
    this.entryService
      .getAllSurveySubmissionEntry(period)
      .pipe(
        catchError((err) => {
          console.error(err);
          return of([] as Entry[]);
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

  onDownloadClick(event: MouseEvent, row: Entry): void {
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

  onRowClick(row: Entry): void {
    const p = this.activePeriod();
    if (!p) return;

    this.entryService
      .isUpdate(row)
      .pipe(catchError(() => of(false)))
      .subscribe((isUpdate) => {
        this.entryService.setFromEntry(row, isUpdate, p);
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

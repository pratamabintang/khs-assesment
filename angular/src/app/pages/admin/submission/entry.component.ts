import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonthPickerComponent, MonthValue } from './modal/month-picker.component';
import { AdminService } from '../admin.service';
import { Router } from '@angular/router';
import { Entry } from '../../../shared/type/survey-submission/entry.type';
import { DownloadService } from '../../../shared/download/download.service';
import { finalize, take } from 'rxjs/operators';
import { DownloadAllComponent, DownloadAllPayload } from './modal/download-all.component';
import { BulkDownloadDto } from '../../../shared/download/dto/bulk-download.dto';

type SortKey = 'fullName' | 'position' | 'companyName';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-admin-submission-list-preview',
  standalone: true,
  imports: [CommonModule, MonthPickerComponent, DownloadAllComponent],
  templateUrl: './entry.template.html',
})
export class EntryComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly downloadService = inject(DownloadService);
  private readonly router = inject(Router);

  rows = signal<Entry[]>([]);
  filteredRows = signal<Entry[]>([]);
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
      .downloadBulkZip({ dataIds: ids } as BulkDownloadDto)
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

  onRowClick(row: Entry): void {
    this.adminService.setFromEntry(row);
    this.router.navigate(['/admin', 'submission', row.surveyId], {
      state: { entry: row },
    });
  }

  onDownloadRowClick(event: MouseEvent, row: Entry): void {
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

  onDeleteRowClick(event: MouseEvent, row: Entry): void {
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

  rowCompanyName(row: Entry): string {
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

  private getSortValue(row: Entry, key: SortKey): string {
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

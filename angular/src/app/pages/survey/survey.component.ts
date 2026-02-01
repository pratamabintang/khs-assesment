import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, take } from 'rxjs/operators';
import { of } from 'rxjs';

import { SurveyApiService } from './survey.service';

import { AssignSurveyModalComponent, AssignSurveyPayload } from './modal/assign-modal.component';
import { SurveyResponse } from './response/survey.response';

@Component({
  selector: 'app-survey-admin',
  standalone: true,
  imports: [CommonModule, AssignSurveyModalComponent],
  templateUrl: './survey.template.html',
})
export class SurveyComponent {
  private router = inject(Router);
  private api = inject(SurveyApiService);

  query = signal('');
  loading = signal(true);
  errorMsg = signal<string | null>(null);

  surveys = signal<SurveyResponse[]>([]);

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
          return of([] as SurveyResponse[]);
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

  onDelete(s: SurveyResponse) {
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

  openAssignModal(s: SurveyResponse): void {
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

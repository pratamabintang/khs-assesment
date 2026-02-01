import { CommonModule, Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, finalize, of, switchMap } from 'rxjs';

import { SurveyDynamicFormComponent } from '../../survey/survey-dynamic-form.component';
import { AdminService } from '../admin.service';
import { SurveyApiService } from '../../survey/survey.service';
import { DataAnswer } from '../../../shared/type/survey-submission/data-answer.type';
import { Survey } from '../../../shared/type/survey/survey.type';

@Component({
  selector: 'app-admin-survey-view-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SurveyDynamicFormComponent],
  templateUrl: './submission.template.html',
})
export class SubmissionComponent {
  private readonly adminService = inject(AdminService);
  private readonly api = inject(SurveyApiService);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  selectedEntry = this.adminService.selectedEntry;

  oldAnswers = signal<DataAnswer[] | null>(null);

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
          finalize(() => {
            this.loading.set(false);
            this.answersLoading.set(false);
          }),
          catchError((err) => {
            console.error('Gagal load submission lama', err);
            this.loadError.set(true);
            this.survey.set(null);
            this.oldAnswers.set(null);
            return of(null);
          }),
        )
        .subscribe((res) => {
          this.survey.set(res?.survey ?? null);
          this.oldAnswers.set(res?.data?.answers ?? null);
          if (!res?.survey) this.loadError.set(true);
        });
    } else {
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

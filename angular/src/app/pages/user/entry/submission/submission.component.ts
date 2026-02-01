import { CommonModule, Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, of, switchMap, catchError } from 'rxjs';
import { SurveyDynamicFormComponent } from '../../../survey/survey-dynamic-form.component';
import { SurveyApiService } from '../../../survey/survey.service';
import { DataDto } from '../../../survey/dto/data.dto';
import { EntryService } from '../entry.service';
import { DataAnswer } from '../../../../shared/type/survey-submission/data-answer.type';
import { Survey } from '../../../../shared/type/survey/survey.type';

@Component({
  selector: 'app-submission',
  standalone: true,
  imports: [CommonModule, RouterModule, SurveyDynamicFormComponent],
  templateUrl: './submission.template.html',
})
export class SubmissionComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(SurveyApiService);
  private location = inject(Location);
  private readonly entryService = inject(EntryService);

  selectedEntry = this.entryService.selectedEntry;
  selectedUpdate = this.entryService.selectedIsUpdate;

  oldAnswers = signal<DataAnswer[] | null>(null);
  survey = signal<Survey | null>(null);

  loading = signal(true);
  loadError = signal(false);
  submitting = signal(false);

  period = signal<string | null>(null);

  isLive = computed<boolean>(() => {
    const p = this.period();
    if (!p) return true;
    return p === this.getCurrentPeriod();
  });

  constructor() {
    if (!this.selectedEntry()) {
      const entry = history.state?.entry;
      const updateSubmission = history.state?.isUpdate;
      const period = history.state?.period;
      if (entry) this.entryService.setFromEntry(entry, updateSubmission, period);
    }

    if (!this.selectedEntry()) {
      this.entryService.clear();
      this.router.navigate(['/user', 'employees'], { replaceUrl: true });
      return;
    }

    const p = (history.state?.period ?? '').toString();
    const resolvedPeriod = this.isValidPeriod(p) ? p : this.getCurrentPeriod();
    this.period.set(resolvedPeriod);

    const nosqlId = this.selectedEntry()?.nosql ?? null;
    if (nosqlId) {
      this.entryService
        .getSurveySubmission(nosqlId)
        .pipe(
          finalize(() => this.loading.set(false)),
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
          next: (s) => {
            this.survey.set(s);
          },
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
    else this.router.navigate(['/user', 'employees'], { replaceUrl: true });
  }

  onSubmit(payload: DataDto) {
    if (!this.isLive()) return;

    this.submitting.set(true);

    payload.entryId = this.selectedEntry()!.id;
    payload.employeeId = this.selectedEntry()!.employeeId;

    const req$ = this.selectedUpdate()
      ? this.api.updateSurvey(this.selectedEntry()?.nosql!, payload)
      : this.api.submitSurvey(payload);

    req$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => {
        this.router.navigate(['/user', 'employees'], { replaceUrl: true });
      },
      error: () => {},
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

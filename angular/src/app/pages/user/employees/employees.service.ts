import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ErrorService } from '../../../shared/error.service';
import { catchError, Observable, throwError } from 'rxjs';
import { SurveySubmissionEntry } from '../../../shared/type/survey-submission/survey-submission-entry.type';
import { Survey } from '../../../shared/type/survey/survey.type';
import { SurveySubmission } from '../../../shared/type/survey-submission/survey-submission.type';

@Injectable({
  providedIn: 'root',
})
export class EmployeesService {
  private readonly http = inject(HttpClient);
  private readonly errorService = inject(ErrorService);

  readonly selectedEntry = signal<SurveySubmissionEntry | null>(null);
  readonly selectedIsUpdate = signal<boolean>(false);

  private readonly baseUrl = 'https://localhost:3000';

  setFromEntry(entry: SurveySubmissionEntry, isUpdate: boolean) {
    this.selectedEntry.set(entry ?? null);
    this.selectedIsUpdate.set(isUpdate);
  }

  clear() {
    this.selectedEntry.set(null);
    this.selectedIsUpdate.set(false);
  }

  getAllSurveySubmissionEntry(month: string): Observable<SurveySubmissionEntry[]> {
    this.errorService.clearError();

    const params = new HttpParams().set('month', month);

    return this.http
      .get<SurveySubmissionEntry[]>(`${this.baseUrl}/submission-entry`, { params })
      .pipe(catchError((err) => this.handleError(err)));
  }

  isUpdate(dto: SurveySubmissionEntry): Observable<boolean> {
    this.errorService.clearError();

    const data = {
      employeeId: dto.employeeId,
      surveyId: dto.surveyId,
      periodMonth: dto.periodMonth,
    };

    return this.http
      .post<boolean>(`${this.baseUrl}/submission-entry/isUpdate`, data)
      .pipe(catchError((err) => this.handleError(err)));
  }

  getSurveySubmission(
    submissionId: string,
  ): Observable<{ survey: Survey; submission: SurveySubmission }> {
    return this.http
      .get<{
        survey: Survey;
        submission: SurveySubmission;
      }>(`${this.baseUrl}/submission/${submissionId}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(err: HttpErrorResponse) {
    const rawMsg = err.error?.message;

    let messages: string[] = [];

    if (Array.isArray(rawMsg)) {
      messages = rawMsg.filter((x) => typeof x === 'string' && x.trim().length > 0);
    } else if (typeof rawMsg === 'string' && rawMsg.trim()) {
      messages = [rawMsg];
    } else if (typeof err.message === 'string' && err.message.trim()) {
      messages = [err.message];
    } else {
      messages = ['Terjadi kesalahan. Silakan coba lagi.'];
    }

    this.errorService.showError(messages);
    return throwError(() => messages);
  }
}

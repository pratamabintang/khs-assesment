import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ErrorService } from '../../../shared/error.service';
import { catchError, Observable, throwError } from 'rxjs';
import { Entry } from '../../../shared/type/survey-submission/entry.type';
import { Survey } from '../../../shared/type/survey/survey.type';
import { Data } from '../../../shared/type/survey-submission/data.type';

@Injectable({
  providedIn: 'root',
})
export class EntryService {
  private readonly http = inject(HttpClient);
  private readonly errorService = inject(ErrorService);

  readonly selectedEntry = signal<Entry | null>(null);
  readonly selectedIsUpdate = signal<boolean>(false);
  readonly selectedPeriod = signal<string>('');

  private readonly baseUrl = 'https://localhost:3000/api';

  setFromEntry(entry: Entry, isUpdate: boolean, period: string) {
    this.selectedEntry.set(entry ?? null);
    this.selectedIsUpdate.set(isUpdate);
    this.selectedPeriod.set(period);
  }

  clear() {
    this.selectedEntry.set(null);
    this.selectedIsUpdate.set(false);
    this.selectedPeriod.set('');
  }

  getAllSurveySubmissionEntry(month: string): Observable<Entry[]> {
    this.errorService.clearError();

    const params = new HttpParams().set('month', month);

    return this.http
      .get<Entry[]>(`${this.baseUrl}/submission-entry`, { params })
      .pipe(catchError((err) => this.handleError(err)));
  }

  isUpdate(dto: Entry): Observable<boolean> {
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

  getSurveySubmission(submissionId: string): Observable<{ survey: Survey; data: Data }> {
    return this.http
      .get<{
        survey: Survey;
        data: Data;
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

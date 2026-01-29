import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { ErrorService } from '../../shared/error.service';
import { SurveySubmissionEntry } from '../../shared/type/survey-submission/survey-submission-entry.type';
import { SurveySubmission } from '../../shared/type/survey-submission/survey-submission.type';
import { Survey } from '../../shared/type/survey/survey.type';
import { User } from '../../shared/type/user.type';
import { Employee } from '../../shared/type/employee.type';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly authService = inject(AuthService);
  private http = inject(HttpClient);
  private readonly errorService = inject(ErrorService);
  readonly selectedEntry = signal<SurveySubmissionEntry | null>(null);

  private readonly baseUrl = 'https://karyahusadasejahtera.web.id/api';

  setFromEntry(entry: SurveySubmissionEntry) {
    this.selectedEntry.set(entry ?? null);
  }

  clear() {
    this.selectedEntry.set(null);
  }

  getSurveySubmission(
    submissionId: string,
  ): Observable<{ survey: Survey; submission: SurveySubmission }> {
    this.errorService.clearError();

    return this.http
      .get<{
        survey: Survey;
        submission: SurveySubmission;
      }>(`${this.baseUrl}/submission/${submissionId}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  getAllAdmin(from?: string, to?: string): Observable<SurveySubmissionEntry[]> {
    this.errorService.clearError();

    const params = this.buildParams({ from, to });
    return this.http
      .get<SurveySubmissionEntry[]>(`${this.baseUrl}/submission-entry/admin`, {
        params,
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  removeEntry(entryId: string): Observable<void> {
    this.errorService.clearError();

    return this.http
      .delete<void>(`${this.baseUrl}/submission/${entryId}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  getAllClient(): Observable<User[] | null> {
    this.errorService.clearError();

    return this.http
      .get<User[] | null>(`${this.baseUrl}/users`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  getAllEmployee(): Observable<Employee[] | null> {
    this.errorService.clearError();

    return this.http
      .get<Employee[] | null>(`${this.baseUrl}/employees`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  removeEmployee(employeeId: string): Observable<void> {
    this.errorService.clearError();

    return this.http
      .delete<void>(`${this.baseUrl}/employees/${employeeId}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  removeClient(userId: string): Observable<void> {
    this.errorService.clearError();

    return this.http
      .delete<void>(`${this.baseUrl}/users/${userId}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  assignEmployee(employeeId: string, userId: string | null): Observable<boolean> {
    this.errorService.clearError();

    return this.http
      .patch<boolean>(`${this.baseUrl}/employees/assign/${employeeId}`, { userId })
      .pipe(catchError((err) => this.handleError(err)));
  }

  createEmployee(
    clientId: string | null,
    fullName: string,
    position: string | null,
    isActive: boolean | null,
  ): Observable<Employee> {
    this.errorService.clearError();

    return this.http
      .post<Employee>(`${this.baseUrl}/employees`, {
        userId: clientId,
        fullName,
        position,
        isActive,
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  updateEmployee(
    employeeId: string,
    clientId: string | null,
    fullName: string,
    position: string | null,
    isActive: boolean | null,
  ): Observable<Employee> {
    this.errorService.clearError();

    return this.http
      .patch<Employee>(`${this.baseUrl}/employees/${employeeId}`, {
        userId: clientId,
        fullName,
        position,
        isActive,
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  logout() {
    this.authService.logout();
  }

  private buildParams(q: { from?: string; to?: string }): HttpParams {
    let params = new HttpParams();
    if (q.from && q.from.trim().length) params = params.set('from', q.from.trim());
    if (q.to && q.to.trim().length) params = params.set('to', q.to.trim());
    return params;
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

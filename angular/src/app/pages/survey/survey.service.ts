import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { ErrorService } from '../../shared/error.service';
import { DataDto } from './dto/data.dto';
import { SurveyType } from '../../shared/type/survey/survey-type.type';
import { Survey } from '../../shared/type/survey/survey.type';
import { AssignSurveyPayload } from './modal/assign-modal.component';
import { SurveyResponse } from './response/survey.response';
import { CreateSurveyDto, CreateSurveyQuestionDto } from './dto/create-survey.dto';
import { environment } from '../../../env/env';

@Injectable({ providedIn: 'root' })
export class SurveyApiService {
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  private readonly baseUrl = `${environment.apiUrl}`;

  submitSurvey(body: DataDto): Observable<void> {
    this.errorService.clearError();

    return this.http
      .post<void>(`${this.baseUrl}/submission`, body)
      .pipe(catchError((err) => this.handleError(err)));
  }

  updateSurvey(submissionId: string, body: DataDto): Observable<void> {
    this.errorService.clearError();

    return this.http
      .patch<void>(`${this.baseUrl}/submission/${submissionId}`, body)
      .pipe(catchError((err) => this.handleError(err)));
  }

  listSurveys(): Observable<SurveyResponse[]> {
    this.errorService.clearError();

    return this.http
      .get<SurveyResponse[]>(`${this.baseUrl}/survey`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  getSurvey(id: string): Observable<SurveyResponse> {
    this.errorService.clearError();

    return this.http
      .get<SurveyResponse>(`${this.baseUrl}/survey/${id}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  createSurvey(body: Survey): Observable<SurveyResponse> {
    this.errorService.clearError();

    const payload: CreateSurveyDto = this.toCreateDto(body);
    return this.http
      .post<SurveyResponse>(`${this.baseUrl}/survey`, payload)
      .pipe(catchError((err) => this.handleError(err)));
  }

  softDeleteSurvey(id: string): Observable<void> {
    this.errorService.clearError();

    return this.http
      .delete<void>(`${this.baseUrl}/survey/${id}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  assignSurvey(payload: AssignSurveyPayload): Observable<void> {
    this.errorService.clearError();

    return this.http
      .post<void>(`${this.baseUrl}/submission-entry`, payload)
      .pipe(catchError((err) => this.handleError(err)));
  }

  private toCreateDto(survey: Survey): CreateSurveyDto {
    const questions = (survey.questions ?? []).map((q) => {
      const base: CreateSurveyQuestionDto = {
        type: q.type,
        title: q.title,
        description: q.description ?? '',
        required: q.required ?? true,
      };

      if (q.type === SurveyType.RANGE) {
        return {
          ...base,
          min: q.min ?? 0,
          max: q.max ?? 10,
          details: (q.details ?? []).map((d) => ({
            title: d.title,
            explanation: d.explanation,
            shortQuestion: (d.shortQuestion ?? '') as string,
            point: d.point,
          })),
        };
      }

      if (q.type === SurveyType.RADIO) {
        return {
          ...base,
          details: (q.details ?? []).map((d) => ({
            title: d.title,
            explanation: d.explanation,
            shortQuestion: (d.shortQuestion ?? '') as string,
            point: d.point,
          })),
        };
      }

      return base;
    });

    return {
      title: survey.title,
      description: survey.description ?? '',
      questions,
    };
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

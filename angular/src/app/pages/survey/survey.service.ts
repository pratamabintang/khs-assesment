import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { ErrorService } from '../../shared/error.service';
import { SurveySubmitPayload } from './survey-answer.type';
import { SurveyType } from '../../shared/type/survey/survey-type.type';
import { Survey } from '../../shared/type/survey/survey.type';
import { AssignSurveyPayload } from './modal/assign-modal.component';

export interface CreateSurveyQuestionDetailDto {
  title: string;
  explanation: string;
  shortQuestion: string;
  point: string;
}

export interface CreateSurveyQuestionDto {
  type: SurveyType;
  title: string;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  details?: CreateSurveyQuestionDetailDto[];
}

export interface CreateSurveyDto {
  title: string;
  description: string;
  questions?: CreateSurveyQuestionDto[];
}

export interface UpdateSurveyQuestionDetailDto {
  id?: string;
  title?: string;
  explanation?: string;
  shortQuestion?: string;
  point?: string;
}

export interface UpdateSurveyQuestionDto {
  id?: string;
  type?: SurveyType;
  title?: string;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  details?: UpdateSurveyQuestionDetailDto[];
  removeDetailIds?: string[];
}

export interface UpdateSurveyDto {
  title?: string;
  description?: string;
  question?: UpdateSurveyQuestionDto[];
  removeQuestionIds?: string[];
}

export interface SurveyListItem {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class SurveyApiService {
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  private readonly baseUrl = 'https://localhost:3000';

  submitSurvey(body: SurveySubmitPayload): Observable<void> {
    this.errorService.clearError();
    return this.http
      .post<void>(`${this.baseUrl}/submission`, body)
      .pipe(catchError((err) => this.handleError(err)));
  }

  updateSurvey(submissionId: string, body: SurveySubmitPayload): Observable<void> {
    this.errorService.clearError();

    return this.http
      .patch<void>(`${this.baseUrl}/submission/${submissionId}`, body)
      .pipe(catchError((err) => this.handleError(err)));
  }

  listSurveys(): Observable<SurveyListItem[]> {
    this.errorService.clearError();
    return this.http
      .get<SurveyListItem[]>(`${this.baseUrl}/survey`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  getSurvey(id: string): Observable<Survey> {
    this.errorService.clearError();
    return this.http
      .get<Survey>(`${this.baseUrl}/survey/${id}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  createSurvey(body: Survey): Observable<Survey> {
    this.errorService.clearError();
    const payload: CreateSurveyDto = this.toCreateDto(body);
    return this.http
      .post<Survey>(`${this.baseUrl}/survey`, payload)
      .pipe(catchError((err) => this.handleError(err)));
  }

  patchSurveyFull(original: Survey, current: Survey): Observable<Survey> {
    this.errorService.clearError();
    if (!original?.id) throw new Error('original.id is required');
    if (!current?.id) throw new Error('current.id is required');

    const payload: UpdateSurveyDto = this.toUpdateDtoFull(original, current);
    return this.http
      .patch<Survey>(`${this.baseUrl}/survey/${current.id}`, payload)
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

  private isTempId(id?: string | null): boolean {
    return typeof id === 'string' && id.startsWith('tmp_');
  }

  private onlyRealIds(ids: Array<string | undefined | null>): string[] {
    return ids.filter((id): id is string => typeof id === 'string' && !this.isTempId(id));
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

  private toUpdateDtoFull(original: Survey, current: Survey): UpdateSurveyDto {
    const removeQuestionIds = this.diffRemovedQuestionIds(original, current);

    const question: UpdateSurveyQuestionDto[] = (current.questions ?? []).map((q) => {
      const isNewQ = this.isTempId(q.id);

      const qDto: UpdateSurveyQuestionDto = {
        ...(isNewQ ? {} : { id: q.id }),
        type: q.type,
        title: q.title,
        description: q.description ?? '',
        required: q.required ?? true,
      };

      if (q.type === SurveyType.RANGE) {
        qDto.min = q.min ?? 0;
        qDto.max = q.max ?? 10;
      }

      if (q.type === SurveyType.RADIO || q.type === SurveyType.RANGE) {
        qDto.details = (q.details ?? []).map((d) => {
          const isNewD = this.isTempId(d.id);

          return {
            ...(isNewD ? {} : { id: d.id }),
            title: d.title,
            explanation: d.explanation,
            shortQuestion: d.shortQuestion ?? '',
            point: d.point,
          } satisfies UpdateSurveyQuestionDetailDto;
        });

        const originalQ = (original.questions ?? []).find((oq) => oq.id === q.id);
        qDto.removeDetailIds = originalQ ? this.diffRemovedDetailIds(originalQ, q) : [];
      } else {
        qDto.details = [];
        qDto.removeDetailIds = [];
      }

      return qDto;
    });

    return {
      title: current.title,
      description: current.description ?? '',
      question,
      removeQuestionIds,
    };
  }

  private diffRemovedQuestionIds(original: Survey, current: Survey): string[] {
    const origIds = new Set<string>(this.onlyRealIds((original.questions ?? []).map((q) => q.id)));
    const currIds = new Set<string>(this.onlyRealIds((current.questions ?? []).map((q) => q.id)));

    const removed: string[] = [];
    for (const id of origIds) {
      if (!currIds.has(id)) removed.push(id);
    }
    return removed;
  }

  private diffRemovedDetailIds(
    originalQ: { details?: { id?: string | null }[] },
    currentQ: { details?: { id?: string | null }[] },
  ): string[] {
    const origIds = new Set<string>(
      (originalQ.details ?? [])
        .map((d) => d.id)
        .filter((id): id is string => typeof id === 'string' && !this.isTempId(id)),
    );

    const currIds = new Set<string>(
      (currentQ.details ?? [])
        .map((d) => d.id)
        .filter((id): id is string => typeof id === 'string' && !this.isTempId(id)),
    );

    const removed: string[] = [];
    for (const id of origIds) {
      if (!currIds.has(id)) removed.push(id);
    }
    return removed;
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

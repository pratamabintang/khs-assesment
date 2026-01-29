import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { ErrorService } from '../error.service';

type bulkDownloadDto = {
  submissionIds: string[];
};

@Injectable({ providedIn: 'root' })
export class DownloadService {
  private readonly http = inject(HttpClient);
  private readonly errorService = inject(ErrorService);
  private readonly baseUrl = 'https://karyahusadasejahtera.web.id/api/pdf';

  downloadPdf(id: string): Observable<Blob> {
    this.errorService.clearError();
    return this.http
      .get(`${this.baseUrl}/${encodeURIComponent(id)}`, {
        responseType: 'blob',
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  downloadBulkZip(dto: bulkDownloadDto): Observable<Blob> {
    const date = new Date();
    return this.http
      .post(this.baseUrl, dto, {
        responseType: 'blob',
        observe: 'body',
      })
      .pipe(
        tap((blob) =>
          this.saveBlob(
            blob,
            `surveysubmission${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}${date.getMilliseconds()}.zip`,
          ),
        ),
        catchError((err) => this.handleError(err)),
      );
  }

  private saveBlob(blob: Blob, filename: string) {
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(blobUrl);
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

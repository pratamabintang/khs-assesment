import { Injectable, signal } from '@angular/core';
import { SurveyQuestionDetail } from './type/survey/survey.type';

@Injectable({
  providedIn: 'root',
})
export class DetailsService {
  private _detail = signal<SurveyQuestionDetail[] | null>(null);

  detail = this._detail.asReadonly();

  showDetails(detailInput: SurveyQuestionDetail[]) {
    this._detail.set(detailInput);
  }

  clearDetails() {
    this._detail.update(() => null);
  }
}

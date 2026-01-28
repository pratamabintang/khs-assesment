import { CommonModule } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { SurveyRangeInputComponent } from './input/range-input';
import { SurveyRadioInputComponent } from './input/radio-input';
import { SurveyTextareaInputComponent } from './input/textarea-input';
import { DetailsService } from '../../shared/details.service';
import { SurveyType } from '../../shared/type/survey/survey-type.type';
import { SurveyQuestion } from '../../shared/type/survey/survey.type';

@Component({
  selector: 'app-survey-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SurveyRangeInputComponent,
    SurveyRadioInputComponent,
    SurveyTextareaInputComponent,
  ],
  template: `
    <div class="rounded-xl border border-slate-200 bg-white p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-slate-900">
              {{ question().title }}
            </h3>

            @if (question().required) {
              <span class="text-xs font-semibold text-rose-600">*</span>
            }
          </div>

          @if (question().description) {
            <p class="mt-1 text-sm text-slate-600 break-words [overflow-wrap:anywhere]">
              {{ question().description }}
            </p>
          }
        </div>

        @if (hasDetails()) {
          <button
            type="button"
            class="shrink-0 self-start mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            (click)="toggleDetails()"
            [attr.aria-label]="showDetails() ? 'Sembunyikan penjelasan' : 'Tampilkan penjelasan'"
            [attr.aria-expanded]="showDetails()"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 10v7"></path>
              <path d="M12 7h.01"></path>
            </svg>
          </button>
        }
      </div>

      <div class="mt-3">
        @switch (question().type) {
          @case (surveyType.RANGE) {
            <app-survey-range-input [question]="question()" [control]="control()" />
          }
          @case (surveyType.RADIO) {
            <app-survey-radio-input [question]="question()" [control]="control()" />
          }
          @case (surveyType.TEXTAREA) {
            <app-survey-textarea-input [question]="question()" [control]="control()" />
          }
          @default {
            <div class="text-sm text-rose-600">Tipe "{{ question().type }}" belum didukung.</div>
          }
        }
      </div>

      @if (showRequiredError()) {
        <div class="mt-2 text-xs text-rose-600">Wajib diisi.</div>
      }
    </div>
  `,
})
export class SurveyFieldComponent {
  radioGroupName = input<string>('');
  detailsService = inject(DetailsService);
  question = input.required<SurveyQuestion>();
  control = input.required<FormControl<string | number | null>>();

  protected readonly surveyType = SurveyType;

  showDetails = signal(false);

  toggleDetails() {
    this.showDetails.update((v) => !v);
    this.detailsService.showDetails(this.question().details!);
  }

  hasDetails(): boolean {
    return (this.question().details?.length ?? 0) > 0;
  }

  showRequiredError(): boolean {
    const c = this.control();
    return c.hasError('required') && (c.touched || c.dirty);
  }
}

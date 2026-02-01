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
  templateUrl: './survey-field.template.html',
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

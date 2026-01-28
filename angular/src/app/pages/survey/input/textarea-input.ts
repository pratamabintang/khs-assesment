import { CommonModule } from '@angular/common';
import { Component, input, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SurveyQuestion } from '../../../shared/type/survey/survey.type';

@Component({
  selector: 'app-survey-textarea-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <textarea
      rows="4"
      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
      [formControl]="control()"
      placeholder="..."
    ></textarea>
  `,
})
export class SurveyTextareaInputComponent {
  question = input.required<SurveyQuestion>();
  control = input.required<FormControl<string | number | null>>();
}

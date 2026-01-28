import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SurveyQuestion } from '../../../shared/type/survey/survey.type';

@Component({
  selector: 'app-survey-range-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-2">
      <input
        type="range"
        class="w-full accent-slate-900"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [formControl]="control()"
      />

      <div class="flex justify-between text-sm text-slate-600">
        <span>{{ min() }}</span>
        <div class="flex justify-center">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-sm font-medium"
          >
            {{ control().value }}
          </div>
        </div>
        <span>{{ max() }}</span>
      </div>
    </div>
  `,
})
export class SurveyRangeInputComponent {
  question = input.required<SurveyQuestion>();
  control = input.required<FormControl<string | number | null>>();

  min = computed(() => this.question().min ?? 0);
  max = computed(() => this.question().max ?? 10);
  step = computed(() => 1);
}

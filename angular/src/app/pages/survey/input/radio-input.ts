import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SurveyQuestion } from '../../../shared/type/survey/survey.type';

@Component({
  selector: 'app-survey-radio-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-3">
      <div class="space-y-2">
        @for (opt of question().details ?? []; track opt.id) {
          <label
            class="block cursor-pointer rounded-xl border border-slate-200 bg-white transition hover:bg-slate-50"
            [attr.for]="'opt-' + opt.id"
          >
            <div class="flex items-start gap-3 p-3">
              <input
                [id]="'opt-' + opt.id"
                type="radio"
                class="mt-1 h-4 w-4 accent-slate-900"
                [name]="question().id"
                [value]="+opt.point"
                [formControl]="control()"
              />

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-start gap-x-2 gap-y-1">
                  <div
                    class="
                    text-sm
                    font-semibold
                    text-slate-900
                    min-w-0
                    break-all
                    whitespace-normal
                    [overflow-wrap:anywhere]
                  "
                  >
                    {{ opt.shortQuestion }}
                  </div>
                </div>

                <div class="mt-1 text-xs text-slate-500">
                  point: <span class="font-mono">{{ opt.point }}</span>
                </div>
              </div>
            </div>
          </label>
        } @empty {
          <div class="text-xs text-slate-500">Kehilangan opsi.</div>
        }
      </div>
    </div>
  `,
})
export class SurveyRadioInputComponent {
  question = input.required<SurveyQuestion>();
  control = input.required<FormControl<string | number | null>>();
}

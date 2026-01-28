import { CommonModule } from '@angular/common';
import { Component, inject, input, OnChanges, output, SimpleChanges } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { SurveySubmitPayload } from './survey-answer.type';

import { SurveyFieldComponent } from './survey-field';
import { SurveyType } from '../../shared/type/survey/survey-type.type';
import { Survey, SurveyQuestion } from '../../shared/type/survey/survey.type';

type AnswerGroup = FormGroup<{
  questionId: FormControl<string>;
  type: FormControl<SurveyType>;
  value: FormControl<string | number | null>;
}>;

type InitialAnswer = {
  questionId: string;
  type: SurveyType;
  value: string | number | null;
};

@Component({
  selector: 'app-survey-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SurveyFieldComponent],
  template: `
    <form class="mx-auto w-full max-w-3xl" [formGroup]="form" (ngSubmit)="submit()">
      <div class="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div
          class="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50"
          aria-hidden="true"
        ></div>

        <div class="relative p-6 sm:p-7">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    [class.bg-emerald-500]="mode() === 'live'"
                    [class.bg-slate-400]="mode() !== 'live'"
                  ></span>
                  {{
                    mode() === 'live'
                      ? 'Live'
                      : mode() === 'readonly'
                        ? 'Read-only'
                        : 'Builder Preview'
                  }}
                </span>

                @if (survey()?.questions?.length) {
                  <span
                    class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {{ survey()!.questions!.length }} pertanyaan
                  </span>
                }
              </div>

              <h2 class="text-xl font-semibold tracking-tight text-slate-900">
                {{ survey()?.title || '—' }}
              </h2>

              @if (survey()?.description) {
                <p class="text-sm leading-relaxed text-slate-600">
                  {{ survey()?.description }}
                </p>
              } @else {
                <p class="text-sm text-slate-500">Tidak ada deskripsi.</p>
              }
            </div>

            @if (mode() === 'live') {
              <button
                type="submit"
                class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                [disabled]="form.invalid"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M2.94 2.94a.75.75 0 01.82-.16l13.5 6a.75.75 0 010 1.36l-13.5 6A.75.75 0 012 15.5V11a1 1 0 011-1h6a1 1 0 100-2H3a1 1 0 01-1-1V3.5a.75.75 0 01.94-.56z"
                  />
                </svg>
                Submit
              </button>
            }
          </div>
        </div>

        <div class="relative border-t border-slate-200 bg-white p-6 sm:p-7">
          @if (survey()?.questions?.length) {
            <div class="space-y-5" formArrayName="answers">
              @for (q of survey()!.questions!; track q.id; let i = $index) {
                <div
                  class="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
                  [formGroupName]="i"
                >
                  <app-survey-field [question]="q" [control]="answers.at(i).controls.value" />
                </div>
              }
            </div>
          } @else {
            <div
              class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"
            >
              <div
                class="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-slate-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M3 4a2 2 0 012-2h6a2 2 0 012 2v2h2a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V4z"
                  />
                </svg>
              </div>
              <div class="mt-3 text-sm font-semibold text-slate-900">Belum ada pertanyaan</div>
              <div class="mt-1 text-xs text-slate-500">
                Tambahkan pertanyaan di builder untuk melihat form di sini.
              </div>
            </div>
          }

          @if (mode() === 'live') {
            <div class="mt-6">
              @if (form.invalid && form.touched) {
                <div
                  class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                >
                  Masih ada pertanyaan yang wajib diisi.
                </div>
              }
            </div>
          }

          @if (mode() === 'readonly') {
            <div class="mt-6">
              <div
                class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
              >
                Mode read-only: admin hanya dapat melihat jawaban, tidak dapat mengubah/submit.
              </div>
            </div>
          }
        </div>
      </div>
    </form>
  `,
})
export class SurveyDynamicFormComponent implements OnChanges {
  private fb = inject(FormBuilder);

  survey = input.required<Survey | null>();

  mode = input<'builder' | 'live' | 'readonly'>('live');

  initialAnswers = input<InitialAnswer[] | null>(null);

  submitted = output<SurveySubmitPayload>();

  form = this.fb.group({
    surveyId: this.fb.control<string>('', { nonNullable: true }),
    answers: this.fb.array<AnswerGroup>([]),
  });

  ngOnChanges(changes: SimpleChanges): void {
    // jika survey/mode berubah, rebuild agar validators + disabled state benar
    if (changes['survey'] || changes['mode']) {
      this.buildForm(this.survey());
      this.patchInitialAnswers();
      this.applyReadOnlyState();
      return;
    }

    // initialAnswers datang belakangan (async)
    if (changes['initialAnswers']) {
      this.patchInitialAnswers();
      // pastikan tetap disabled kalau readonly
      this.applyReadOnlyState();
    }
  }

  get answers(): FormArray<AnswerGroup> {
    return this.form.controls.answers;
  }

  private buildForm(survey: Survey | null) {
    this.answers.clear();
    if (!survey) return;

    this.form.controls.surveyId.setValue(survey.id ?? '', { emitEvent: false });

    (survey.questions ?? []).forEach((q) => {
      this.answers.push(this.createAnswerGroup(q));
    });
  }

  private createAnswerGroup(q: SurveyQuestion): AnswerGroup {
    // ✅ validators hanya untuk live
    const validators = this.mode() === 'live' && q.required ? [Validators.required] : [];

    // default initial (range) hanya relevan saat user isi; untuk readonly nanti akan di-patch dari oldAnswers
    const initial: string | number | null = q.type === SurveyType.RANGE ? (q.min ?? 0) : null;

    return this.fb.group({
      questionId: this.fb.control(q.id, { nonNullable: true }),
      type: this.fb.control(q.type, { nonNullable: true }),
      value: this.fb.control<string | number | null>(initial, { validators }),
    });
  }

  private patchInitialAnswers(): void {
    const initial = this.initialAnswers();
    if (!initial || !initial.length) return;
    if (!this.answers || this.answers.length === 0) return;

    const map = new Map<string, InitialAnswer>();
    initial.forEach((a) => map.set(a.questionId, a));

    this.answers.controls.forEach((g) => {
      const qid = g.controls.questionId.value;
      const old = map.get(qid);
      if (!old) return;

      g.controls.value.setValue(old.value ?? null, { emitEvent: false });
    });
  }

  private applyReadOnlyState(): void {
    const isRO = this.mode() === 'readonly';

    // disable/enable controls, tapi tetap biarkan patchInitialAnswers bisa jalan
    this.answers.controls.forEach((g) => {
      const ctrl = g.controls.value;
      if (isRO) ctrl.disable({ emitEvent: false });
      else ctrl.enable({ emitEvent: false });
    });

    // form overall status gak perlu disable (cukup control value), supaya builder/live tetap normal
  }

  submit() {
    if (this.mode() !== 'live') return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const payload: SurveySubmitPayload = {
      entryId: '',
      surveyId: this.form.controls.surveyId.value,
      employeeId: '',
      answers: this.answers.controls.map((g) => ({
        questionId: g.controls.questionId.value,
        type: g.controls.type.value,
        value: g.controls.value.value,
      })),
    };

    this.submitted.emit(payload);
  }
}

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

import { DataDto } from './dto/data.dto';

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
  templateUrl: './survey-dynamic-form.template.html',
})
export class SurveyDynamicFormComponent implements OnChanges {
  private fb = inject(FormBuilder);

  survey = input.required<Survey | null>();

  mode = input<'builder' | 'live' | 'readonly'>('live');

  initialAnswers = input<InitialAnswer[] | null>(null);

  submitted = output<DataDto>();

  form = this.fb.group({
    surveyId: this.fb.control<string>('', { nonNullable: true }),
    answers: this.fb.array<AnswerGroup>([]),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['survey'] || changes['mode']) {
      this.buildForm(this.survey());
      this.patchInitialAnswers();
      this.applyReadOnlyState();
      return;
    }

    if (changes['initialAnswers']) {
      this.patchInitialAnswers();
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
    const validators = this.mode() === 'live' && q.required ? [Validators.required] : [];

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

    this.answers.controls.forEach((g) => {
      const ctrl = g.controls.value;
      if (isRO) ctrl.disable({ emitEvent: false });
      else ctrl.enable({ emitEvent: false });
    });
  }

  submit() {
    if (this.mode() !== 'live') return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const payload: DataDto = {
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

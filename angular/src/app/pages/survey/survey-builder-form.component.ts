import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { catchError, finalize, map, startWith } from 'rxjs/operators';
import { of } from 'rxjs';

import { SurveyDynamicFormComponent } from './survey-dynamic-form.component';
import { QuestionEditorComponent } from './question-editor.component';
import { SurveyApiService } from './survey.service';
import { SurveyType } from '../../shared/type/survey/survey-type.type';
import { Survey, SurveyQuestion, SurveyQuestionDetail } from '../../shared/type/survey/survey.type';

type OptionGroup = FormGroup<{
  id: FormControl<string>;
  title: FormControl<string>;
  explanation: FormControl<string>;
  shortQuestion: FormControl<string | null>;
  point: FormControl<string>;
}>;

type QuestionGroup = FormGroup<{
  id: FormControl<string>;
  title: FormControl<string>;
  description: FormControl<string>;
  required: FormControl<boolean>;
  type: FormControl<SurveyType>;
  min: FormControl<number | null>;
  max: FormControl<number | null>;
  details: FormArray<OptionGroup>;
}>;

const LIMITS = {
  surveyTitle: 120,
  surveyDescription: 300,

  questionTitle: 120,
  questionDescription: 300,

  optionTitle: 120,
  optionExplanation: 800,
  optionPoint: 60,
  shortQuestion: 140,

  rangeMaxAllowed: 100,
};

const MAX_QUESTIONS = 20;

function requiredTrimmed(control: AbstractControl) {
  const v = control.value;
  if (v == null) return { required: true };
  if (typeof v === 'string' && v.trim().length === 0) return { required: true };
  return null;
}

function minArrayLength(min: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormArray)) return null;
    const len = control.controls.length;
    return len >= min ? null : { minArrayLength: { required: min, actual: len } };
  };
}

function maxArrayLength(max: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormArray)) return null;
    const len = control.controls.length;
    return len <= max ? null : { maxArrayLength: { required: max, actual: len } };
  };
}

function clampStringControl(control: AbstractControl, max: number) {
  const clamp = (v: unknown) => {
    if (typeof v !== 'string') return;
    if (v.length <= max) return;
    control.setValue(v.slice(0, max), { emitEvent: false });
  };

  clamp(control.value);
  const sub = (control as any).valueChanges?.subscribe?.((v: unknown) => clamp(v));
  return sub;
}

@Component({
  selector: 'app-survey-builder-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuestionEditorComponent, SurveyDynamicFormComponent],
  templateUrl: 'survey-builder-form.template.html',
})
export class SurveyBuilderPageComponent {
  private fb = inject(FormBuilder);
  private api = inject(SurveyApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected readonly LIMITS = LIMITS;
  protected readonly MAX_QUESTIONS = MAX_QUESTIONS;

  builderSubmit: Survey | null = null;

  loading = signal(false);
  errorMsg = signal<string | null>(null);

  mode = signal<'create' | 'patch'>('create');
  originalSurvey = signal<Survey | null>(null);

  submittedOnce = signal(false);

  readonly surveyId = toSignal(
    this.route.paramMap.pipe(
      map((pm) => pm.get('id')),
      startWith(this.route.snapshot.paramMap.get('id')),
    ),
    { initialValue: this.route.snapshot.paramMap.get('id') },
  );

  builderForm = this.fb.group({
    title: this.fb.control<string>('Survey Baru', {
      nonNullable: true,
      validators: [requiredTrimmed, Validators.maxLength(LIMITS.surveyTitle)],
    }),
    description: this.fb.control<string>('', {
      nonNullable: true,
      validators: [requiredTrimmed, Validators.maxLength(LIMITS.surveyDescription)],
    }),
    questions: this.fb.array<QuestionGroup>([], {
      validators: [minArrayLength(1), maxArrayLength(MAX_QUESTIONS)],
    }),
  });

  constructor() {
    clampStringControl(this.builderForm.controls.title, LIMITS.surveyTitle);
    clampStringControl(this.builderForm.controls.description, LIMITS.surveyDescription);

    effect(() => {
      const id = this.surveyId();

      this.builderSubmit = null;
      this.errorMsg.set(null);
      this.submittedOnce.set(false);

      if (id) {
        this.mode.set('patch');
        this.fetchAndLoad(id);
      } else {
        this.mode.set('create');
        if (this.questions.length === 0) this.addQuestion();
      }
    });

    effect(() => {
      if (this.loading()) {
        this.builderForm.disable({ emitEvent: false });
      } else {
        this.builderForm.enable({ emitEvent: false });
      }
    });
  }

  get questions(): FormArray<QuestionGroup> {
    return this.builderForm.controls.questions;
  }

  addQuestion() {
    if (this.loading()) return;

    const fa = this.questions;

    if (fa.length >= MAX_QUESTIONS) {
      fa.updateValueAndValidity({ emitEvent: false });
      fa.markAsTouched();
      return;
    }

    fa.push(this.createQuestionGroup());
    fa.updateValueAndValidity({ emitEvent: false });
  }

  moveQuestion(i: number, delta: -1 | 1) {
    if (this.loading()) return;

    const fa = this.questions;
    const to = i + delta;

    if (to < 0 || to >= fa.length) return;

    const ctrl = fa.at(i);
    fa.removeAt(i);
    fa.insert(to, ctrl);

    fa.updateValueAndValidity({ emitEvent: false });
  }

  removeQuestion(i: number) {
    if (this.loading()) return;
    this.questions.removeAt(i);
    this.questions.updateValueAndValidity({ emitEvent: false });
  }

  showErr(control: AbstractControl | null | undefined) {
    if (!control) return false;
    return control.invalid && (control.touched || this.submittedOnce());
  }

  private scrollToFirstInvalid() {
    setTimeout(() => {
      const el = document.querySelector('.js-invalid') as HTMLElement | null;
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus?.();
    });
  }

  private createQuestionGroup(seed?: Partial<SurveyQuestion>): QuestionGroup {
    const id = seed?.id ?? this.tmpId('q');

    const detailsFA = this.fb.array<OptionGroup>(
      (seed?.details ?? []).map((d) => this.createOptionGroup(d)),
    );

    const g = this.fb.group({
      id: this.fb.control(id, { nonNullable: true }),

      title: this.fb.control(seed?.title ?? 'Pertanyaan baru', {
        nonNullable: true,
        validators: [requiredTrimmed, Validators.maxLength(LIMITS.questionTitle)],
      }),

      description: this.fb.control(seed?.description ?? '', {
        nonNullable: true,
        validators: [requiredTrimmed, Validators.maxLength(LIMITS.questionDescription)],
      }),

      required: this.fb.control(seed?.required ?? true, { nonNullable: true }),

      type: this.fb.control(seed?.type ?? SurveyType.TEXTAREA, {
        nonNullable: true,
        validators: [Validators.required],
      }),

      min: this.fb.control<number | null>(seed?.min ?? null),
      max: this.fb.control<number | null>(seed?.max ?? null),

      details: detailsFA,
    });

    clampStringControl(g.controls.title, LIMITS.questionTitle);
    clampStringControl(g.controls.description, LIMITS.questionDescription);

    g.controls.details.controls.forEach((opt) => {
      clampStringControl(opt.controls.title, LIMITS.optionTitle);
      clampStringControl(opt.controls.explanation, LIMITS.optionExplanation);
      clampStringControl(opt.controls.point, LIMITS.optionPoint);
      clampStringControl(opt.controls.shortQuestion, LIMITS.shortQuestion);
    });

    return g;
  }

  private createOptionGroup(seed?: Partial<SurveyQuestionDetail>): OptionGroup {
    const id = seed?.id ?? this.tmpId('d');

    const g = this.fb.group({
      id: this.fb.control(id, { nonNullable: true }),

      title: this.fb.control(seed?.title ?? '', {
        nonNullable: true,
        validators: [requiredTrimmed, Validators.maxLength(LIMITS.optionTitle)],
      }),

      explanation: this.fb.control(seed?.explanation ?? '', {
        nonNullable: true,
        validators: [requiredTrimmed, Validators.maxLength(LIMITS.optionExplanation)],
      }),

      shortQuestion: this.fb.control<string | null>(seed?.shortQuestion ?? null),

      point: this.fb.control(seed?.point ?? '', {
        nonNullable: true,
        validators: [requiredTrimmed, Validators.maxLength(LIMITS.optionPoint)],
      }),
    });

    clampStringControl(g.controls.title, LIMITS.optionTitle);
    clampStringControl(g.controls.explanation, LIMITS.optionExplanation);
    clampStringControl(g.controls.point, LIMITS.optionPoint);
    clampStringControl(g.controls.shortQuestion, LIMITS.shortQuestion);

    return g;
  }

  private fetchAndLoad(id: string) {
    this.loading.set(true);
    this.errorMsg.set(null);

    this.api
      .getSurvey(id)
      .pipe(
        catchError((err) => {
          console.error(err);
          this.errorMsg.set('Gagal mengambil survey dari backend.');
          return of(null);
        }),
      )
      .subscribe((survey) => {
        try {
          if (!survey) return;

          this.originalSurvey.set(survey);

          this.builderForm.enable({ emitEvent: false });

          this.builderForm.controls.title.setValue(survey.title ?? '', { emitEvent: false });
          this.builderForm.controls.description.setValue(survey.description ?? '', {
            emitEvent: false,
          });

          this.questions.clear();
          (survey.questions ?? []).forEach((q: SurveyQuestion) =>
            this.questions.push(this.createQuestionGroup(q)),
          );

          this.questions.updateValueAndValidity({ emitEvent: false });

          this.builderForm.markAsPristine();
          this.builderForm.markAsUntouched();

          this.submittedOnce.set(false);
        } finally {
          this.loading.set(false);
        }
      });
  }

  private builderValueSig = toSignal(
    this.builderForm.valueChanges.pipe(startWith(this.builderForm.getRawValue())),
    { initialValue: this.builderForm.getRawValue() },
  );

  readonly surveyPreviewSig = computed<Survey>(() => {
    const v = this.builderValueSig();
    const original = this.originalSurvey();

    const questions: SurveyQuestion[] = (v.questions ?? []).map((q) => ({
      id: q.id!,
      required: !!q.required,
      title: q.title!,
      description: q.description ?? '',
      type: q.type!,
      min: q.type === SurveyType.RANGE ? (q.min ?? 0) : null,
      max: q.type === SurveyType.RANGE ? (q.max ?? 10) : null,
      details:
        q.type === SurveyType.RADIO || q.type === SurveyType.RANGE
          ? (q.details ?? []).map(
              (d) =>
                ({
                  id: d.id!,
                  title: d.title!,
                  explanation: d.explanation!,
                  shortQuestion: d.shortQuestion ?? undefined,
                  point: d.point!,
                }) satisfies SurveyQuestionDetail,
            )
          : [],
    }));

    const id =
      this.mode() === 'patch' ? (original?.id ?? this.generatedSurveyId) : this.generatedSurveyId;

    return {
      id,
      title: v.title!,
      description: v.description ?? '',
      questions,
    };
  });

  private tmpId(kind: 'q' | 'd') {
    const uuid = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    return `tmp_${kind}-${uuid}`;
  }

  private readonly generatedSurveyId = crypto?.randomUUID
    ? crypto.randomUUID()
    : `survey-${Date.now()}-${Math.random()}`;

  submitBuilder() {
    if (this.loading()) return;

    this.submittedOnce.set(true);
    this.builderForm.markAllAsTouched();
    this.builderSubmit = null;

    if (this.builderForm.invalid) {
      this.scrollToFirstInvalid();
      return;
    }

    const current = this.surveyPreviewSig();
    this.builderSubmit = current;

    if (this.mode() === 'create') {
      this.loading.set(true);
      this.errorMsg.set(null);

      this.api
        .createSurvey(current)
        .pipe(
          catchError((err) => {
            console.error(err);
            this.errorMsg.set('Create survey gagal.');
            return of(null);
          }),
          finalize(() => this.loading.set(false)),
        )
        .subscribe((created) => {
          if (!created) return;
          this.router.navigate(['/admin/survey']);
        });

      return;
    }
  }

  goBack() {
    if (this.loading()) return;
    this.router.navigate(['/admin/survey']);
  }
}

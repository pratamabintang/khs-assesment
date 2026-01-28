// survey-builder-form.ts
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

import { SurveyDynamicFormComponent } from './survey-dynamic-form';
import { QuestionEditorComponent } from './question-editor';
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

function requiredTrimmed(control: AbstractControl) {
  const v = control.value;
  if (v == null) return { required: true };
  if (typeof v === 'string' && v.trim().length === 0) return { required: true };
  return null;
}

function minArrayLength(min: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const arr = control as FormArray;
    const len = Array.isArray(arr.controls) ? arr.controls.length : 0;
    return len >= min ? null : { minArrayLength: { required: min, actual: len } };
  };
}

/**
 * Hard clamp: user tidak bisa input/paste lebih dari max.
 * - langsung potong value jika kepanjangan
 * - subscribe valueChanges untuk clamp terus-menerus
 */
function clampStringControl(control: AbstractControl, max: number) {
  const clamp = (v: unknown) => {
    if (typeof v !== 'string') return;
    if (v.length <= max) return;
    control.setValue(v.slice(0, max), { emitEvent: false });
  };

  clamp(control.value);
  const sub = (control as any).valueChanges?.subscribe?.((v: unknown) => clamp(v));
  return sub; // optional kalau mau di-unsubscribe, tapi component-lifecycle biasanya cukup
}

@Component({
  selector: 'app-survey-builder-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuestionEditorComponent, SurveyDynamicFormComponent],
  template: `
    <div class="min-h-screen bg-slate-50">
      <div class="mx-auto max-w-6xl p-6">
        <!-- Top Header Card (Modern) -->
        <div
          class="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50"
            aria-hidden="true"
          ></div>

          <div class="relative p-6 sm:p-7">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="space-y-1">
                <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
                  {{ mode() === 'patch' ? 'Edit Survey' : 'Buat Survey' }}
                </h1>
                <p class="text-sm text-slate-600">
                  Susun judul, deskripsi, dan pertanyaan. Preview di panel kanan.
                </p>

                @if (mode() === 'patch' && originalSurvey()?.id) {
                  <div
                    class="mt-2 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
                  >
                    <span class="font-medium">Survey ID</span>
                    <span class="font-mono text-slate-800">{{ originalSurvey()!.id }}</span>
                  </div>
                }
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                  (click)="addQuestion()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Tambah Pertanyaan
                </button>

                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-60"
                  (click)="submitBuilder()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7.414a2 2 0 00-.586-1.414l-2.414-2.414A2 2 0 0013.586 3H4z"
                    />
                    <path d="M6 9a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" />
                  </svg>
                  Submit
                </button>
              </div>
            </div>

            <!-- Sub status row -->
            <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                  Mode: <span class="font-semibold text-slate-800">{{ mode() }}</span>
                </span>

                <span
                  class="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
                >
                  Pertanyaan:
                  <span class="font-semibold text-slate-800">{{ questions.length }}</span>
                </span>
              </div>

              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                (click)="goBack()"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L10.414 9H17a1 1 0 110 2h-6.586l2.293 2.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="relative mt-6">
          @if (loading()) {
            <div class="absolute inset-0 z-10 rounded-3xl bg-white/50 backdrop-blur-[2px]"></div>
          }

          <div
            class="grid grid-cols-1 gap-6 lg:grid-cols-2"
            [class.pointer-events-none]="loading()"
            [class.select-none]="loading()"
            [attr.aria-busy]="loading()"
          >
            <!-- LEFT: BUILDER -->
            <section class="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <!-- Sticky mini header inside card -->
              <div
                class="sticky top-0 z-[1] rounded-t-3xl border-b border-slate-200 bg-white/80 backdrop-blur px-6 py-4"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-sm font-semibold text-slate-900">Builder</div>
                    <div class="text-xs text-slate-500">Edit judul/deskripsi dan pertanyaan</div>
                  </div>

                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                    (click)="toggleJson()"
                  >
                    Tampilkan JSON
                  </button>
                </div>
              </div>

              <div class="p-6">
                @if (loading()) {
                  <div
                    class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
                  >
                    Loading...
                  </div>
                }
                @if (errorMsg()) {
                  <div
                    class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                  >
                    {{ errorMsg() }}
                  </div>
                }
                @if (questions.length === 0) {
                  <div
                    class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                  >
                    Minimal harus ada <b>1 pertanyaan</b> sebelum bisa submit.
                  </div>
                }

                <form class="mt-6 space-y-5" [formGroup]="builderForm">
                  <!-- Title -->
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-700">Judul Survey</label>
                    <input
                      class="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 disabled:opacity-60
                             border-slate-200 focus:ring-indigo-200"
                      [class.border-rose-300]="showErr(builderForm.controls.title)"
                      [class.focus:ring-rose-200]="showErr(builderForm.controls.title)"
                      [class.js-invalid]="showErr(builderForm.controls.title)"
                      formControlName="title"
                      placeholder="Contoh: Kepuasan Pelanggan"
                      [attr.maxlength]="LIMITS.surveyTitle"
                    />
                    <div class="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Maks {{ LIMITS.surveyTitle }} karakter</span>
                      <span
                        >{{ builderForm.controls.title.value.length }}/{{
                          LIMITS.surveyTitle
                        }}</span
                      >
                    </div>

                    @if (showErr(builderForm.controls.title)) {
                      <div class="text-xs text-rose-600">Judul survey wajib diisi.</div>
                    }
                  </div>

                  <!-- Description -->
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-700">Deskripsi</label>
                    <textarea
                      rows="2"
                      class="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 disabled:opacity-60
                             border-slate-200 focus:ring-indigo-200"
                      [class.border-rose-300]="showErr(builderForm.controls.description)"
                      [class.focus:ring-rose-200]="showErr(builderForm.controls.description)"
                      [class.js-invalid]="showErr(builderForm.controls.description)"
                      formControlName="description"
                      placeholder="Deskripsi singkat..."
                      [attr.maxlength]="LIMITS.surveyDescription"
                    ></textarea>
                    <div class="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Maks {{ LIMITS.surveyDescription }} karakter</span>
                      <span
                        >{{ builderForm.controls.description.value.length }}/{{
                          LIMITS.surveyDescription
                        }}</span
                      >
                    </div>

                    @if (showErr(builderForm.controls.description)) {
                      <div class="text-xs text-rose-600">Deskripsi survey wajib diisi.</div>
                    }
                  </div>

                  <!-- Questions -->
                  <div class="pt-2">
                    <div class="flex items-center justify-between">
                      <h2 class="text-sm font-semibold text-slate-900">Pertanyaan</h2>
                      <span class="text-xs text-slate-500">Total: {{ questions.length }}</span>
                    </div>

                    @if (showErr(questions)) {
                      <div
                        class="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                      >
                        Minimal harus ada <b>1 pertanyaan</b>.
                      </div>
                    }

                    <div class="mt-4 space-y-4" formArrayName="questions">
                      @for (q of questions.controls; track q.controls.id.value; let i = $index) {
                        <app-question-editor
                          [group]="q"
                          [index]="i"
                          [submitted]="submittedOnce()"
                          [canMoveUp]="i > 0"
                          [canMoveDown]="i < questions.length - 1"
                          (moveUp)="moveQuestion(i, -1)"
                          (moveDown)="moveQuestion(i, +1)"
                          (remove)="removeQuestion(i)"
                        />
                      }
                      @if (questions.length === 0) {
                        <div
                          class="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-600"
                        >
                          Belum ada pertanyaan. Klik <b>Tambah Pertanyaan</b>.
                        </div>
                      }
                    </div>
                  </div>
                </form>

                @if (builderForm.invalid && (builderForm.touched || submittedOnce())) {
                  <div
                    class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                  >
                    Masih ada field builder yang wajib diisi. Field yang bermasalah sudah ditandai
                    merah.
                  </div>
                }
              </div>
            </section>

            <!-- RIGHT: PREVIEW -->
            <section class="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div
                class="sticky top-0 z-[1] rounded-t-3xl border-b border-slate-200 bg-white/80 backdrop-blur px-6 py-4"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-sm font-semibold text-slate-900">Preview</div>
                    <div class="text-xs text-slate-500">Tampilan end-user (builder mode)</div>
                  </div>

                  <span
                    class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    Live
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  </span>
                </div>
              </div>

              <div class="p-6">
                <div class="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
                  <app-survey-dynamic-form [survey]="surveyPreviewSig()" mode="live" />
                </div>
              </div>
            </section>
          </div>
        </div>

        <!-- Footer hint -->
        <div class="mt-6 text-xs text-slate-500">
          Tip: gunakan tombol <span class="font-semibold text-slate-700">Tampilkan JSON</span> untuk
          melihat payload yang akan dikirim.
        </div>
      </div>
    </div>
  `,
})
export class SurveyBuilderPageComponent {
  private fb = inject(FormBuilder);
  private api = inject(SurveyApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected readonly LIMITS = LIMITS;

  showJson = signal(false);
  builderSubmit: Survey | null = null;

  loading = signal(false);
  errorMsg = signal<string | null>(null);

  mode = signal<'create' | 'patch'>('create');
  originalSurvey = signal<Survey | null>(null);

  /**
   * Flag untuk memunculkan error walau field belum pernah disentuh (UX).
   */
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
    questions: this.fb.array<QuestionGroup>([], { validators: [minArrayLength(1)] }),
  });

  constructor() {
    // Hard clamp untuk survey header
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

  toggleJson() {
    if (this.loading()) return;
    this.showJson.update((v) => !v);
  }

  addQuestion() {
    if (this.loading()) return;
    this.questions.push(this.createQuestionGroup());
    this.questions.updateValueAndValidity({ emitEvent: false });
  }

  moveQuestion(i: number, delta: -1 | 1) {
    if (this.loading()) return;

    const fa = this.questions;
    const to = i + delta;

    // guard index
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

  /**
   * Visible-error rule (touched OR already submitted)
   */
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

    // Hard clamp untuk question fields (meski editor juga clamp, ini jaga-jaga)
    clampStringControl(g.controls.title, LIMITS.questionTitle);
    clampStringControl(g.controls.description, LIMITS.questionDescription);

    // clamp untuk option seeds
    g.controls.details.controls.forEach((opt) => {
      clampStringControl(opt.controls.title, LIMITS.optionTitle);
      clampStringControl(opt.controls.explanation, LIMITS.optionExplanation);
      clampStringControl(opt.controls.point, LIMITS.optionPoint);
      if (opt.controls.shortQuestion)
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

    // Hard clamp option fields
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

  readonly surveyJsonSig = computed(() => JSON.stringify(this.surveyPreviewSig(), null, 2));

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

    const original = this.originalSurvey();
    if (!original) {
      this.errorMsg.set('Tidak ada snapshot survey lama untuk patch.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);

    this.api
      .patchSurveyFull(original, current)
      .pipe(
        catchError((err) => {
          console.error(err);
          this.errorMsg.set('Patch survey gagal.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((updated) => {
        if (!updated) return;

        this.originalSurvey.set(updated);
        this.builderForm.markAsPristine();
        this.builderForm.markAsUntouched();
        this.submittedOnce.set(false);
        this.router.navigate(['/admin/survey']);
      });
  }

  goBack() {
    if (this.loading()) return;
    this.router.navigate(['/admin/survey']);
  }
}

// question-editor.ts
import { CommonModule } from '@angular/common';
import { Component, effect, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SurveyType } from '../../shared/type/survey/survey-type.type';

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
  questionTitle: 120,
  questionDescription: 500,
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

function rangeValidator(group: AbstractControl) {
  const g = group as unknown as QuestionGroup;
  const t = g.controls.type.value;

  if (t !== SurveyType.RANGE) return null;

  const min = g.controls.min.value;
  const max = g.controls.max.value;

  if (min == null || max == null) return { rangeRequired: true };
  if (min < 0) return { rangeMinInvalid: true };
  if (max > LIMITS.rangeMaxAllowed) return { rangeMaxTooHigh: true };
  if (min > max) return { rangeMinGreaterThanMax: true };

  return null;
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
  selector: 'app-question-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div
      [formGroup]="group()"
      class="group mb-2 rounded-3xl border bg-white shadow-sm transition hover:shadow-md"
      [class.border-rose-200]="shouldShowGroupError()"
      [class.border-slate-200]="!shouldShowGroupError()"
    >
      <!-- Header / Summary -->
      <div class="flex items-start justify-between gap-3 p-4 sm:p-5">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-start gap-3 text-left"
          (click)="toggle()"
        >
          <span
            class="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm"
            [class.rotate-180]="expanded()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 transition-transform"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                clip-rule="evenodd"
              />
            </svg>
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <div class="text-xs font-medium text-slate-500">Pertanyaan #{{ index() + 1 }}</div>

              <span
                class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
              >
                {{ group().controls.type.value }}
              </span>

              @if (group().controls.required.value) {
                <span
                  class="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200"
                >
                  Required
                </span>
              } @else {
                <span
                  class="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"
                >
                  Optional
                </span>
              }
              @if (shouldShowGroupError()) {
                <span
                  class="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200"
                >
                  Ada error
                </span>
              }
            </div>

            <div class="mt-1 truncate text-sm font-semibold text-slate-900">
              {{ group().controls.title.value || '—' }}
            </div>

            <div class="mt-1 line-clamp-1 text-xs text-slate-500">
              {{ group().controls.description.value || 'Tambahkan deskripsi agar lebih jelas…' }}
            </div>
          </div>
        </button>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            [disabled]="!canMoveUp()"
            (click)="moveUp.emit()"
            title="Naik"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 3a1 1 0 01.707.293l4 4a1 1 0 11-1.414 1.414L11 6.414V16a1 1 0 11-2 0V6.414L6.707 8.707A1 1 0 015.293 7.293l4-4A1 1 0 0110 3z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            [disabled]="!canMoveDown()"
            (click)="moveDown.emit()"
            title="Turun"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 17a1 1 0 01-.707-.293l-4-4a1 1 0 111.414-1.414L9 13.586V4a1 1 0 112 0v9.586l2.293-2.293a1 1 0 111.414 1.414l-4 4A1 1 0 0110 17z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            (click)="remove.emit()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M8.5 3a1 1 0 00-1 1v1H5a1 1 0 000 2h.293l.854 10.243A2 2 0 008.14 19h3.72a2 2 0 001.993-1.757L14.707 7H15a1 1 0 100-2h-2.5V4a1 1 0 00-1-1h-3zm1 2h2V5h-2v0z"
                clip-rule="evenodd"
              />
            </svg>
            Hapus
          </button>
        </div>
      </div>

      <!-- Body -->
      @if (expanded()) {
        <div class="border-t border-slate-200 p-4 sm:p-5">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <!-- Type -->
            <div class="space-y-2">
              <label class="text-xs font-semibold text-slate-700">Tipe</label>
              <select
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                formControlName="type"
                (change)="onTypeChange()"
              >
                <option [ngValue]="SurveyType.RANGE">RANGE</option>
                <option [ngValue]="SurveyType.RADIO">RADIO</option>
                <option [ngValue]="SurveyType.TEXTAREA">TEXTAREA</option>
              </select>
            </div>

            <!-- Required -->
            <div class="space-y-2">
              <label class="text-xs font-semibold text-slate-700">Wajib?</label>
              <label
                class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm"
              >
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    class="h-4 w-4 accent-slate-900"
                    formControlName="required"
                  />
                  <span class="font-medium">Required</span>
                </div>
                <span class="text-xs text-slate-500">User harus mengisi</span>
              </label>
            </div>

            <!-- Title -->
            <div class="space-y-2 sm:col-span-2">
              <label class="text-xs font-semibold text-slate-700">Judul</label>
              <input
                class="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2
                     border-slate-200 focus:ring-indigo-200"
                [class.border-rose-300]="showError(group().controls.title)"
                [class.focus:ring-rose-200]="showError(group().controls.title)"
                [class.js-invalid]="showError(group().controls.title)"
                formControlName="title"
                placeholder="Judul pertanyaan..."
                [attr.maxlength]="LIMITS.questionTitle"
              />
              <div class="flex items-center justify-between text-[11px] text-slate-500">
                <span>Maks {{ LIMITS.questionTitle }} karakter</span>
                <span>{{ group().controls.title.value.length }}/{{ LIMITS.questionTitle }}</span>
              </div>
              @if (showError(group().controls.title)) {
                <div class="text-xs text-rose-600">Judul pertanyaan wajib diisi.</div>
              }
            </div>

            <!-- Description -->
            <div class="space-y-2 sm:col-span-2">
              <label class="text-xs font-semibold text-slate-700">Deskripsi</label>
              <textarea
                rows="2"
                class="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2
                     border-slate-200 focus:ring-indigo-200"
                [class.border-rose-300]="showError(group().controls.description)"
                [class.focus:ring-rose-200]="showError(group().controls.description)"
                [class.js-invalid]="showError(group().controls.description)"
                formControlName="description"
                placeholder="Deskripsi singkat..."
                [attr.maxlength]="LIMITS.questionDescription"
              ></textarea>
              <div class="flex items-center justify-between text-[11px] text-slate-500">
                <span>Maks {{ LIMITS.questionDescription }} karakter</span>
                <span
                  >{{ group().controls.description.value.length }}/{{
                    LIMITS.questionDescription
                  }}</span
                >
              </div>
              @if (showError(group().controls.description)) {
                <div class="text-xs text-rose-600">Deskripsi pertanyaan wajib diisi.</div>
              }
            </div>

            <!-- Range -->
            @if (group().controls.type.value === SurveyType.RANGE) {
              <div class="space-y-2">
                <label class="text-xs font-semibold text-slate-700">Min</label>
                <input
                  type="number"
                  formControlName="min"
                  class="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2
                     border-slate-200 focus:ring-indigo-200"
                  [class.border-rose-300]="showError(group().controls.min)"
                  [class.focus:ring-rose-200]="showError(group().controls.min)"
                  [class.js-invalid]="showError(group().controls.min)"
                />
                @if (showError(group().controls.min)) {
                  <div class="text-xs text-rose-600">Min wajib diisi dan tidak boleh negatif.</div>
                }
              </div>

              <div class="space-y-2">
                <label class="text-xs font-semibold text-slate-700">Max</label>
                <input
                  type="number"
                  formControlName="max"
                  class="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2
                     border-slate-200 focus:ring-indigo-200"
                  [class.border-rose-300]="showError(group().controls.max) || hasRangeError()"
                  [class.focus:ring-rose-200]="showError(group().controls.max) || hasRangeError()"
                  [class.js-invalid]="showError(group().controls.max) || hasRangeError()"
                />
                <div class="text-[11px] text-slate-500">Maks {{ LIMITS.rangeMaxAllowed }}</div>

                @if (hasRangeError()) {
                  <div class="text-xs text-rose-600">
                    @if (group().errors?.['rangeRequired']) {
                      Min & Max wajib diisi.
                    }
                    @if (group().errors?.['rangeMinInvalid']) {
                      Min tidak boleh negatif.
                    }
                    @if (group().errors?.['rangeMaxTooHigh']) {
                      Max tidak boleh lebih dari {{ LIMITS.rangeMaxAllowed }}.
                    }
                    @if (group().errors?.['rangeMinGreaterThanMax']) {
                      Min tidak boleh lebih besar dari Max.
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Options -->
          @if (group().controls.type.value !== SurveyType.TEXTAREA) {
            <div class="mt-6">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <div class="text-sm font-semibold text-slate-900">Opsi</div>
                  <div class="text-xs text-slate-500">
                    Tambahkan pilihan jawaban (untuk RADIO/RANGE).
                  </div>
                </div>

                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                  (click)="addOption()"
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
                  Tambah Opsi
                </button>
              </div>

              <div class="mt-4 space-y-3">
                @for (opt of details().controls; track opt.controls.id.value; let i = $index) {
                  <div
                    class="rounded-2xl border bg-white p-4 shadow-sm"
                    [class.border-rose-200]="opt.invalid && (opt.touched || submitted())"
                    [class.border-slate-200]="!(opt.invalid && (opt.touched || submitted()))"
                    [formGroup]="opt"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div class="text-xs font-semibold text-slate-700">Opsi #{{ i + 1 }}</div>

                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        (click)="removeOption(i)"
                      >
                        Hapus
                      </button>
                    </div>

                    <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div class="space-y-2">
                        <label class="text-xs font-semibold text-slate-700">Judul</label>
                        <input
                          formControlName="title"
                          class="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2
                           border-slate-200 focus:ring-indigo-200"
                          [class.border-rose-300]="showError(opt.controls.title)"
                          [class.focus:ring-rose-200]="showError(opt.controls.title)"
                          [class.js-invalid]="showError(opt.controls.title)"
                          [attr.maxlength]="LIMITS.optionTitle"
                        />
                        @if (showError(opt.controls.title)) {
                          <div class="text-xs text-rose-600">Judul opsi wajib diisi.</div>
                        }
                      </div>

                      <div class="space-y-2">
                        <label class="text-xs font-semibold text-slate-700">Poin</label>
                        <input
                          formControlName="point"
                          class="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2
                           border-slate-200 focus:ring-indigo-200"
                          [class.border-rose-300]="showError(opt.controls.point)"
                          [class.focus:ring-rose-200]="showError(opt.controls.point)"
                          [class.js-invalid]="showError(opt.controls.point)"
                          [attr.maxlength]="LIMITS.optionPoint"
                        />
                        @if (showError(opt.controls.point)) {
                          <div class="text-xs text-rose-600">Poin wajib diisi.</div>
                        }
                      </div>

                      <div class="space-y-2 sm:col-span-2">
                        <label class="text-xs font-semibold text-slate-700">Penjelasan</label>
                        <textarea
                          rows="2"
                          formControlName="explanation"
                          class="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2
                           border-slate-200 focus:ring-indigo-200"
                          [class.border-rose-300]="showError(opt.controls.explanation)"
                          [class.focus:ring-rose-200]="showError(opt.controls.explanation)"
                          [class.js-invalid]="showError(opt.controls.explanation)"
                          [attr.maxlength]="LIMITS.optionExplanation"
                        ></textarea>
                        @if (showError(opt.controls.explanation)) {
                          <div class="text-xs text-rose-600">Penjelasan wajib diisi.</div>
                        }
                      </div>

                      @if (group().controls.type.value === SurveyType.RADIO) {
                        <div class="space-y-2 sm:col-span-2">
                          <label class="text-xs font-semibold text-slate-700"
                            >Pertanyaan pendek</label
                          >
                          <input
                            formControlName="shortQuestion"
                            class="w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2
                           border-slate-200 focus:ring-indigo-200"
                            [class.border-rose-300]="showError(opt.controls.shortQuestion)"
                            [class.focus:ring-rose-200]="showError(opt.controls.shortQuestion)"
                            [class.js-invalid]="showError(opt.controls.shortQuestion)"
                            placeholder="wajib untuk RADIO..."
                            [attr.maxlength]="LIMITS.shortQuestion"
                          />
                          @if (showError(opt.controls.shortQuestion)) {
                            <div class="text-xs text-rose-600">
                              Pertanyaan pendek wajib diisi untuk RADIO.
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
                @if (details().length === 0) {
                  <div
                    class="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-500"
                  >
                    Belum ada opsi. Klik <b>Tambah Opsi</b>.
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class QuestionEditorComponent {
  group = input.required<QuestionGroup>();
  index = input.required<number>();

  /**
   * dari parent (SurveyBuilder): saat submit, field invalid harus langsung merah walau belum touched.
   */
  submitted = input<boolean>(false);

  canMoveUp = input<boolean>(false);
  canMoveDown = input<boolean>(false);

  moveUp = output<void>();
  moveDown = output<void>();

  remove = output<void>();

  SurveyType = SurveyType;
  expanded = signal(false);

  details = () => this.group().controls.details;

  protected readonly LIMITS = LIMITS;

  constructor() {
    // setup validators & clamp setelah input group tersedia
    queueMicrotask(() => {
      const g = this.group();

      g.controls.type.setValidators([Validators.required]);
      g.controls.title.setValidators([requiredTrimmed, Validators.maxLength(LIMITS.questionTitle)]);
      g.controls.description.setValidators([
        requiredTrimmed,
        Validators.maxLength(LIMITS.questionDescription),
      ]);

      g.setValidators([rangeValidator]);

      g.controls.type.updateValueAndValidity({ emitEvent: false });
      g.controls.title.updateValueAndValidity({ emitEvent: false });
      g.controls.description.updateValueAndValidity({ emitEvent: false });
      g.updateValueAndValidity({ emitEvent: false });

      // Hard clamp question fields
      clampStringControl(g.controls.title, LIMITS.questionTitle);
      clampStringControl(g.controls.description, LIMITS.questionDescription);

      // Clamp untuk options yang sudah ada
      this.details().controls.forEach((opt) => {
        clampStringControl(opt.controls.title, LIMITS.optionTitle);
        clampStringControl(opt.controls.explanation, LIMITS.optionExplanation);
        clampStringControl(opt.controls.point, LIMITS.optionPoint);
        clampStringControl(opt.controls.shortQuestion, LIMITS.shortQuestion);
      });

      // IMPORTANT:
      // Jangan clear details/options saat initial load (patch).
      // Rules tipe diterapkan tanpa menghapus opsi yang sudah di-load.
      this.applyTypeRules(false);
    });

    // Auto-expand jika submit dan group invalid
    effect(() => {
      if (!this.submitted()) return;
      const g = this.group();
      if (g.invalid) this.expanded.set(true);
    });
  }

  toggle() {
    this.expanded.update((v) => !v);
  }

  showError(control: AbstractControl | null | undefined) {
    if (!control) return false;
    return control.invalid && (control.touched || this.submitted());
  }

  shouldShowGroupError() {
    const g = this.group();
    return g.invalid && (g.touched || this.submitted());
  }

  hasRangeError() {
    const g = this.group();
    return !!g.errors && (g.touched || this.submitted());
  }

  private tmpId(kind: 'd') {
    return `tmp_${kind}-${crypto.randomUUID?.() ?? Date.now()}`;
  }

  onTypeChange() {
    // User action (dropdown change): boleh reset details/options
    this.applyTypeRules(true);
  }

  private applyTypeRules(resetDetails: boolean) {
    const g = this.group();
    const t = g.controls.type.value;

    g.controls.min.clearValidators();
    g.controls.max.clearValidators();

    // ✅ KUNCI FIX: saat initial patch load, jangan hapus details.
    // Hanya clear kalau user benar-benar mengganti tipe.
    if (resetDetails) {
      this.details().clear();
    }

    if (t === SurveyType.TEXTAREA) {
      g.controls.min.setValue(null, { emitEvent: false });
      g.controls.max.setValue(null, { emitEvent: false });
    }

    if (t === SurveyType.RANGE) {
      g.controls.min.setValidators([Validators.required, Validators.min(0)]);
      g.controls.max.setValidators([
        Validators.required,
        Validators.min(0),
        Validators.max(LIMITS.rangeMaxAllowed),
      ]);

      g.controls.min.setValue(g.controls.min.value ?? 0, { emitEvent: false });
      g.controls.max.setValue(g.controls.max.value ?? 10, { emitEvent: false });
    } else {
      g.controls.min.setValue(null, { emitEvent: false });
      g.controls.max.setValue(null, { emitEvent: false });
    }

    g.controls.min.updateValueAndValidity({ emitEvent: false });
    g.controls.max.updateValueAndValidity({ emitEvent: false });
    g.updateValueAndValidity({ emitEvent: false });

    this.applyShortQuestionPolicy();
  }

  addOption() {
    const opt = new FormGroup({
      id: new FormControl(this.tmpId('d'), { nonNullable: true }),

      title: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrimmed, Validators.maxLength(LIMITS.optionTitle)],
      }),

      point: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrimmed, Validators.maxLength(LIMITS.optionPoint)],
      }),

      explanation: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrimmed, Validators.maxLength(LIMITS.optionExplanation)],
      }),

      shortQuestion: new FormControl<string | null>(null),
    });

    // Hard clamp option fields
    clampStringControl(opt.controls.title, LIMITS.optionTitle);
    clampStringControl(opt.controls.explanation, LIMITS.optionExplanation);
    clampStringControl(opt.controls.point, LIMITS.optionPoint);
    clampStringControl(opt.controls.shortQuestion, LIMITS.shortQuestion);

    this.details().push(opt);
    this.applyShortQuestionPolicy();
  }

  removeOption(i: number) {
    this.details().removeAt(i);
    this.group().updateValueAndValidity({ emitEvent: false });
  }

  private applyShortQuestionPolicy() {
    const isRadio = this.group().controls.type.value === SurveyType.RADIO;

    this.details().controls.forEach((opt) => {
      const c = opt.controls.shortQuestion;

      c.clearValidators();

      if (isRadio) {
        c.setValidators([requiredTrimmed, Validators.maxLength(LIMITS.shortQuestion)]);
        c.enable({ emitEvent: false });
      } else {
        c.setValue(null, { emitEvent: false });
        c.disable({ emitEvent: false });
      }

      c.updateValueAndValidity({ emitEvent: false });

      // Ensure clamp tetap jalan setelah enable/disable
      clampStringControl(c, LIMITS.shortQuestion);
    });
  }
}

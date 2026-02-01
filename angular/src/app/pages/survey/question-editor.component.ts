import { CommonModule } from '@angular/common';
import { Component, effect, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
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
  optionExplanation: 300,
  optionPoint: 7,
  shortQuestion: 100,
  rangeMaxAllowed: 100,
};

const MAX_OPTIONS = 10;

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

function detailsCountValidator(getType: () => SurveyType) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormArray)) return null;

    const t = getType();
    const len = control.length;

    if (t === SurveyType.TEXTAREA) {
      return len === 0 ? null : { detailsNotAllowed: true };
    }

    if (len < 1) return { detailsMin: { required: 1, actual: len } };
    if (len > MAX_OPTIONS) return { detailsMax: { required: MAX_OPTIONS, actual: len } };

    return null;
  };
}

function pointValidatorByQuestionType(getType: () => SurveyType) {
  const digitsOnly = /^[0-9]+$/;
  const rangeFormat = /^\s*(\d{1,3})\s*-\s*(\d{1,3})\s*$/;

  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    const v = typeof raw === 'string' ? raw.trim() : '';

    if (!v) return { required: true };
    if (v.length > LIMITS.optionPoint) {
      return { maxlength: { requiredLength: LIMITS.optionPoint, actualLength: v.length } };
    }

    const t = getType();

    if (t === SurveyType.RADIO) {
      return digitsOnly.test(v) ? null : { pointDigitsOnly: true };
    }

    if (t === SurveyType.RANGE) {
      if (digitsOnly.test(v)) return null;

      const m = v.match(rangeFormat);
      if (!m) return { pointRangeFormat: true };

      const a = Number(m[1]);
      const b = Number(m[2]);

      if (!Number.isFinite(a) || !Number.isFinite(b)) return { pointRangeFormat: true };
      if (a < 0 || b < 0) return { pointRangeOutOfBounds: true };
      if (a > LIMITS.rangeMaxAllowed || b > LIMITS.rangeMaxAllowed)
        return { pointRangeOutOfBounds: true };
      if (a > b) return { pointRangeInvalidOrder: true };

      return null;
    }

    return null;
  };
}

@Component({
  selector: 'app-question-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './question-editor.template.html',
})
export class QuestionEditorComponent {
  group = input.required<QuestionGroup>();
  index = input.required<number>();

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
  protected readonly MAX_OPTIONS = MAX_OPTIONS;

  constructor() {
    queueMicrotask(() => {
      const g = this.group();

      g.controls.type.setValidators([Validators.required]);
      g.controls.title.setValidators([requiredTrimmed, Validators.maxLength(LIMITS.questionTitle)]);
      g.controls.description.setValidators([
        requiredTrimmed,
        Validators.maxLength(LIMITS.questionDescription),
      ]);

      g.controls.details.setValidators([detailsCountValidator(() => g.controls.type.value)]);

      g.setValidators([rangeValidator]);

      g.controls.type.updateValueAndValidity({ emitEvent: false });
      g.controls.title.updateValueAndValidity({ emitEvent: false });
      g.controls.description.updateValueAndValidity({ emitEvent: false });
      g.controls.details.updateValueAndValidity({ emitEvent: false });
      g.updateValueAndValidity({ emitEvent: false });

      clampStringControl(g.controls.title, LIMITS.questionTitle);
      clampStringControl(g.controls.description, LIMITS.questionDescription);

      this.details().controls.forEach((opt) => {
        clampStringControl(opt.controls.title, LIMITS.optionTitle);
        clampStringControl(opt.controls.explanation, LIMITS.optionExplanation);
        clampStringControl(opt.controls.point, LIMITS.optionPoint);
        clampStringControl(opt.controls.shortQuestion, LIMITS.shortQuestion);
      });

      this.applyTypeRules(false);
    });

    effect(() => {
      if (!this.submitted()) return;
      const g = this.group();
      if (g.invalid) this.expanded.set(true);
    });
  }

  len(control: AbstractControl | null | undefined): number {
    const v = control?.value;
    return typeof v === 'string' ? v.length : 0;
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
    this.applyTypeRules(true);
  }

  private applyTypeRules(resetDetails: boolean) {
    const g = this.group();
    const t = g.controls.type.value;

    g.controls.min.clearValidators();
    g.controls.max.clearValidators();

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

    g.controls.details.setValidators([detailsCountValidator(() => g.controls.type.value)]);
    g.controls.details.updateValueAndValidity({ emitEvent: false });

    g.controls.min.updateValueAndValidity({ emitEvent: false });
    g.controls.max.updateValueAndValidity({ emitEvent: false });
    g.updateValueAndValidity({ emitEvent: false });

    this.applyShortQuestionPolicy();
    this.applyPointPolicy();
  }

  addOption() {
    if (this.details().length >= MAX_OPTIONS) {
      this.details().markAsTouched();
      this.details().updateValueAndValidity({ emitEvent: false });
      return;
    }

    const g = this.group();

    const opt = new FormGroup({
      id: new FormControl(this.tmpId('d'), { nonNullable: true }),

      title: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrimmed, Validators.maxLength(LIMITS.optionTitle)],
      }),

      point: new FormControl('', {
        nonNullable: true,
        validators: [pointValidatorByQuestionType(() => g.controls.type.value)],
      }),

      explanation: new FormControl('', {
        nonNullable: true,
        validators: [requiredTrimmed, Validators.maxLength(LIMITS.optionExplanation)],
      }),

      shortQuestion: new FormControl<string | null>(null),
    });

    clampStringControl(opt.controls.title, LIMITS.optionTitle);
    clampStringControl(opt.controls.explanation, LIMITS.optionExplanation);
    clampStringControl(opt.controls.point, LIMITS.optionPoint);
    clampStringControl(opt.controls.shortQuestion, LIMITS.shortQuestion);

    this.details().push(opt);
    this.applyShortQuestionPolicy();
    this.applyPointPolicy();

    this.details().markAsTouched();
    this.details().updateValueAndValidity({ emitEvent: false });
    this.group().updateValueAndValidity({ emitEvent: false });
  }

  removeOption(i: number) {
    this.details().removeAt(i);
    this.details().markAsTouched();
    this.details().updateValueAndValidity({ emitEvent: false });
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
      clampStringControl(c, LIMITS.shortQuestion);
    });
  }

  private applyPointPolicy() {
    const g = this.group();
    this.details().controls.forEach((opt) => {
      const c = opt.controls.point;

      c.setValidators([pointValidatorByQuestionType(() => g.controls.type.value)]);
      c.updateValueAndValidity({ emitEvent: false });

      clampStringControl(c, LIMITS.optionPoint);
    });
  }
}

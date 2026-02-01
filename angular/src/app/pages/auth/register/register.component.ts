import { NgClass } from '@angular/common';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';

import { AuthService } from '../auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { FormComponent } from '../form/form.component';
import { RegionSelectorComponent } from './region-selector.component';

type PasswordRuleKey = 'minLength' | 'lower' | 'upper' | 'digit' | 'symbol' | 'whitespace';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass, FormComponent, RegionSelectorComponent],
  templateUrl: './register.template.html',
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild(RegionSelectorComponent) regionSelector?: RegionSelectorComponent;

  step = signal<1 | 2>(1);
  submitted = signal(false);

  private readonly PHONE_REGEX = /^(?:\+?62|0)8\d{7,12}$/;

  form = new FormGroup(
    {
      companyName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(64)],
      }),

      provinceId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      regencyId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      districtId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      villageId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),

      addressDetail: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(64)],
      }),

      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email, Validators.maxLength(254)],
      }),
      phone: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(this.PHONE_REGEX),
          Validators.maxLength(16),
        ],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.maxLength(32),
          this.passwordStrengthValidator({
            minLength: 8,
            requireLower: true,
            requireUpper: true,
            requireDigit: true,
            requireSymbol: true,
            noWhitespace: true,
          }),
        ],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(32)],
      }),
    },
    { validators: [this.matchFields('password', 'confirmPassword')] },
  );

  get companyName() {
    return this.form.controls.companyName;
  }
  get provinceId() {
    return this.form.controls.provinceId;
  }
  get regencyId() {
    return this.form.controls.regencyId;
  }
  get districtId() {
    return this.form.controls.districtId;
  }
  get villageId() {
    return this.form.controls.villageId;
  }
  get addressDetail() {
    return this.form.controls.addressDetail;
  }
  get email() {
    return this.form.controls.email;
  }
  get phone() {
    return this.form.controls.phone;
  }
  get password() {
    return this.form.controls.password;
  }
  get confirmPassword() {
    return this.form.controls.confirmPassword;
  }

  passwordValue = toSignal(this.password.valueChanges.pipe(startWith(this.password.value)), {
    initialValue: this.password.value,
  });

  passwordRules = computed(() => {
    const v = (this.passwordValue() ?? '').toString();
    return {
      minLength: v.length >= 8,
      upper: /[A-Z]/.test(v),
      lower: /[a-z]/.test(v),
      digit: /\d/.test(v),
      symbol: /[^A-Za-z0-9]/.test(v),
      noSpace: !/\s/.test(v),
    };
  });

  passwordMissingText = computed(() => {
    const r = this.passwordRules();
    const missing: string[] = [];
    if (!r.minLength) missing.push('minimal 8 karakter');
    if (!r.upper) missing.push('huruf besar');
    if (!r.lower) missing.push('huruf kecil');
    if (!r.digit) missing.push('angka');
    if (!r.symbol) missing.push('simbol');
    if (!r.noSpace) missing.push('tanpa spasi');
    return missing.length ? `Kurang: ${missing.join(', ')}.` : '';
  });

  provinceName = computed(() => {
    const rs = this.regionSelector;
    const id = this.provinceId.value;
    return rs?.provinces().find((x) => x.id === id)?.name || '';
  });

  regencyName = computed(() => {
    const rs = this.regionSelector;
    const id = this.regencyId.value;
    return rs?.regencies().find((x) => x.id === id)?.name || '';
  });

  districtName = computed(() => {
    const rs = this.regionSelector;
    const id = this.districtId.value;
    return rs?.districts().find((x) => x.id === id)?.name || '';
  });

  villageName = computed(() => {
    const rs = this.regionSelector;
    const id = this.villageId.value;
    return rs?.villages().find((x) => x.id === id)?.name || '';
  });

  constructor() {
    this.password.valueChanges.subscribe(() => {
      this.confirmPassword.updateValueAndValidity({ onlySelf: true });
      this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });
    });
  }

  isInvalid(ctrl: FormControl): boolean {
    return ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  isLengthInvalid(ctrl: FormControl): boolean {
    return (ctrl === this.addressDetail || ctrl === this.companyName) && ctrl.value?.length > 64;
  }

  get emailError(): string {
    if (!this.isInvalid(this.email)) return '';
    if (this.email.hasError('required')) return 'Email wajib diisi.';
    if (this.email.hasError('email')) return 'Email tidak valid.';
    if (this.email.hasError('maxlength')) return 'Email terlalu panjang.';
    return 'Email tidak valid.';
  }

  get phoneError(): string {
    if (!this.isInvalid(this.phone)) return '';
    if (this.phone.hasError('required')) return 'No HP wajib diisi.';
    if (this.phone.hasError('pattern'))
      return 'Format no HP mengikuti standar +62812xxxx atau 08xxxx.';
    if (this.phone.hasError('maxlength')) return 'No HP terlalu panjang.';
    return 'No HP tidak valid.';
  }

  get passwordError(): string {
    if (!this.isInvalid(this.password)) return '';
    if (this.password.hasError('required')) return 'Password wajib diisi.';
    if (this.password.hasError('maxlength')) return 'Password maksimal 32 karakter.';
    if (this.password.hasError('passwordStrength')) {
      const msg = this.passwordMissingText();
      return msg || 'Password belum memenuhi syarat.';
    }
    return 'Password tidak valid.';
  }

  get confirmPasswordError(): string {
    const touched = this.confirmPassword.touched || this.confirmPassword.dirty;
    if (!touched) return '';
    if (this.confirmPassword.hasError('required')) return 'Konfirmasi password wajib diisi.';
    if (this.form.hasError('mismatch')) return 'Konfirmasi password tidak sama.';
    if (this.confirmPassword.hasError('maxlength')) return 'Konfirmasi password terlalu panjang.';
    return '';
  }

  step1Valid(): boolean {
    return (
      this.companyName.valid &&
      this.provinceId.valid &&
      this.regencyId.valid &&
      this.districtId.valid &&
      this.villageId.valid &&
      this.addressDetail.valid
    );
  }

  step2Valid(): boolean {
    return (
      this.email.valid &&
      this.phone.valid &&
      this.password.valid &&
      this.confirmPassword.valid &&
      !this.form.hasError('mismatch')
    );
  }

  next(): void {
    this.companyName.markAsTouched();
    this.provinceId.markAsTouched();
    this.regencyId.markAsTouched();
    this.districtId.markAsTouched();
    this.villageId.markAsTouched();
    this.addressDetail.markAsTouched();

    if (this.step1Valid()) this.step.set(2);
  }

  back(): void {
    this.step.set(1);
  }

  onSubmit() {
    this.submitted.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const payload: CreateUserDto = {
      name: raw.companyName,
      email: raw.email,
      phoneNumber: raw.phone,
      password: raw.password,
      province: this.provinceName(),
      regency: this.regencyName(),
      district: this.districtName(),
      village: this.villageName(),
      fullAddress: raw.addressDetail,
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.router.navigate(['/auth', 'login']);
      },
      error: () => {},
    });

    this.submitted.set(true);
  }

  private matchFields(field1: string, field2: string) {
    return (group: AbstractControl): ValidationErrors | null => {
      const a = group.get(field1)?.value;
      const b = group.get(field2)?.value;
      if (!a || !b) return null;
      return a === b ? null : { mismatch: true };
    };
  }

  private passwordStrengthValidator(opts: {
    minLength?: number;
    requireLower?: boolean;
    requireUpper?: boolean;
    requireDigit?: boolean;
    requireSymbol?: boolean;
    noWhitespace?: boolean;
  }) {
    return (control: AbstractControl): ValidationErrors | null => {
      const v = (control.value ?? '').toString();
      if (!v) return null;

      const errors: Partial<Record<PasswordRuleKey, true>> = {};
      if (opts['minLength'] && v.length < opts['minLength']) errors.minLength = true;
      if (opts.requireLower && !/[a-z]/.test(v)) errors.lower = true;
      if (opts.requireUpper && !/[A-Z]/.test(v)) errors.upper = true;
      if (opts.requireDigit && !/\d/.test(v)) errors.digit = true;
      if (opts.requireSymbol && !/[^A-Za-z0-9]/.test(v)) errors.symbol = true;
      if (opts.noWhitespace && /\s/.test(v)) errors.whitespace = true;

      return Object.keys(errors).length ? { passwordStrength: errors } : null;
    };
  }
}

import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';

import { Form } from '../form/form';
import { RegionSelector } from './region-selector';
import { AuthService, CreateUserDtoPayload } from '../auth.service';
import { ErrorService } from '../../../shared/error.service';

function matchFields(field1: string, field2: string) {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(field1)?.value;
    const b = group.get(field2)?.value;
    if (!a || !b) return null;
    return a === b ? null : { mismatch: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass, Form, RegionSelector],
  templateUrl: './register.html',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);
  errorService = inject(ErrorService);
  @ViewChild(RegionSelector) regionSelector?: RegionSelector;

  step = signal<1 | 2>(1);
  submitted = signal(false);

  private readonly PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/;
  private readonly PHONE_REGEX = /^(?:\+?62|0)8\d{7,12}$/;

  form = new FormGroup(
    {
      companyName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)],
      }),

      provinceId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      regencyId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      districtId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      villageId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),

      addressDetail: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(5)],
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
          Validators.pattern(this.PASSWORD_REGEX),
          Validators.maxLength(32),
        ],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(32)],
      }),
    },
    { validators: [matchFields('password', 'confirmPassword')] },
  );

  // getters
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

  // name helpers (buat payload)
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
    return 'Email tidak valid.';
  }

  get phoneError(): string {
    if (!this.isInvalid(this.phone)) return '';
    if (this.phone.hasError('required')) return 'No HP wajib diisi.';
    if (this.phone.hasError('pattern'))
      return 'Format no HP mengikuti standar format +62812xxxx dan digit minimum';
    return 'No HP tidak valid.';
  }

  get passwordError(): string {
    if (!this.isInvalid(this.password)) return '';
    if (this.password.hasError('required')) return 'Password wajib diisi.';
    if (this.password.hasError('pattern'))
      return 'Password min 8 karakter, ada huruf besar, huruf kecil, angka, dan simbol (tanpa spasi).';
    return 'Password tidak valid.';
  }

  get confirmPasswordError(): string {
    const touched = this.confirmPassword.touched || this.confirmPassword.dirty;
    if (!touched) return '';
    if (this.confirmPassword.hasError('required')) return 'Konfirmasi password wajib diisi.';
    if (this.form.hasError('mismatch')) return 'Konfirmasi password tidak sama.';
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
    // touch step 1 fields
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

    const payload: CreateUserDtoPayload = {
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
}

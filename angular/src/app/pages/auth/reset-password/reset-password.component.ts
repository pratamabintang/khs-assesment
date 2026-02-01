import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormComponent } from '../form/form.component';
import { AuthService } from '../auth.service';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, FormComponent, RouterLink],
  templateUrl: './reset-password.template.html',
})
export class ResetPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/;

  token = '';
  email = '';
  submitted = signal(false);

  ngOnInit() {
    this.route.queryParamMap.subscribe((queries) => {
      this.token = queries.get('token') ?? '';
      this.email = queries.get('email') ?? '';
    });
  }

  form = new FormGroup({
    password1: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(this.PASSWORD_REGEX),
        Validators.maxLength(32),
      ],
    }),
    password2: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(this.PASSWORD_REGEX),
        Validators.maxLength(32),
      ],
    }),
  });

  get password1() {
    return this.form.get('password1') as FormControl;
  }

  get password2() {
    return this.form.get('password2') as FormControl;
  }

  get password1Invalid(): boolean {
    return this.password1.invalid && (this.password1.dirty || this.password1.touched);
  }

  get password2Invalid(): boolean {
    return (
      (this.password2.invalid && (this.password2.dirty || this.password2.touched)) ||
      this.password1.value !== this.password2.value
    );
  }

  get password1Error(): string | null {
    if (!(this.password1.dirty || this.password1.touched)) return null;
    if (this.password1.hasError('required')) return 'Password wajib diisi.';
    if (this.password1.hasError('minlength')) return 'Password minimal 8 karakter.';
    if (this.password1.hasError('pattern'))
      return 'Password harus mengandung huruf besar, huruf kecil, angka, dan simbol (tanpa spasi).';
    return null;
  }

  get password2Error(): string | null {
    if (!(this.password2.dirty || this.password2.touched)) return null;
    if (this.password2.hasError('required')) return 'Password wajib diisi.';
    if (this.password2.hasError('minlength')) return 'Password minimal 8 karakter.';
    if (this.password2.hasError('pattern'))
      return 'Password harus mengandung huruf besar, huruf kecil, angka, dan simbol (tanpa spasi).';
    if (this.password1.value !== this.password2.value)
      return 'Perbaiki konfirmasi password tidak sesuai';
    return null;
  }

  get formInvalid(): boolean {
    return this.form.invalid;
  }

  onSubmit() {
    this.submitted.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.password1.value == this.password2) {
      return;
    }

    this.authService.resetPassword(
      { password: this.password1.value },
      { email: this.email, token: this.token },
    );

    this.submitted.set(true);
  }
}

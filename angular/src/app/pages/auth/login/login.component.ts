import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FormComponent } from '../form/form.component';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto/login.dto';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, RouterLink, FormComponent],
  templateUrl: './login.template.html',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/;

  submitted = signal(false);

  form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(254)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(this.PASSWORD_REGEX),
        Validators.maxLength(32),
      ],
    }),
  });

  get email() {
    return this.form.get('email') as FormControl;
  }

  get password() {
    return this.form.get('password') as FormControl;
  }

  get emailInvalid(): boolean {
    return this.email.invalid && (this.email.dirty || this.email.touched);
  }

  get passwordInvalid(): boolean {
    return this.password.invalid && (this.password.dirty || this.password.touched);
  }

  get passwordError(): string | null {
    if (!(this.password.dirty || this.password.touched)) return null;
    if (this.password.hasError('required')) return 'Password wajib diisi.';
    if (this.password.hasError('minlength')) return 'Password minimal 8 karakter.';
    if (this.password.hasError('pattern'))
      return 'Password harus mengandung huruf besar, huruf kecil, angka, dan simbol (tanpa spasi).';
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

    const raw = this.form.getRawValue();

    const payload: LoginDto = {
      email: raw.email,
      password: raw.password,
    };

    this.authService.login(payload).subscribe({
      next: () => {},
      error: () => {},
    });
    this.submitted.set(true);
  }
}

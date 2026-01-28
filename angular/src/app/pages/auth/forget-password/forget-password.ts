import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Form } from '../form/form';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [Form, ReactiveFormsModule, NgClass, RouterLink],
  templateUrl: './forget-password.html',
})
export class ForgetPassword {
  constructor(private readonly authService: AuthService) {}
  submitted = false;

  form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(254)],
    }),
  });

  get email() {
    return this.form.controls.email;
  }

  get emailInvalid(): boolean {
    return this.email.touched && this.email.invalid;
  }

  get formInvalid(): boolean {
    return this.form.invalid;
  }

  onSubmit() {
    this.submitted = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.authService.forgetPassword({ email: this.email.value }).subscribe({
      next: () => {},
      error: () => {},
    });

    this.submitted = true;
  }
}

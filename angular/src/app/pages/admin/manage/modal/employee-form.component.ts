import { CommonModule } from '@angular/common';
import { Component, effect, input, output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { User } from '../../../../shared/type/user.type';
import { Employee } from '../../../../shared/type/employee.type';

export type EmployeeFormPayload = {
  id?: string;
  fullName: string;
  position: string;
  isActive: boolean;
  userId: string | null;
};

@Component({
  selector: 'app-employee-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.template.html',
})
export class EmployeeFormModalComponent {
  open = input<boolean>(false);
  mode = input<'create' | 'edit'>('create');
  clients = input<User[]>([]);
  employee = input<Employee | null>(null);

  close = output<void>();
  save = output<EmployeeFormPayload>();

  form = new FormGroup(
    {
      fullName: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(64)],
      }),
      position: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(64)],
      }),
      isActive: new FormControl<boolean>(true, { nonNullable: true }),
      userId: new FormControl<string | null>(null),
    },
    { validators: [this.noWhitespaceOnly('fullName'), this.noWhitespaceOnly('position')] },
  );

  get fullName() {
    return this.form.controls.fullName;
  }
  get position() {
    return this.form.controls.position;
  }
  get isActive() {
    return this.form.controls.isActive;
  }
  get userId() {
    return this.form.controls.userId;
  }

  constructor() {
    effect(() => {
      if (!this.open()) return;

      const mode = this.mode();
      const emp = this.employee();

      if (mode === 'edit' && emp) {
        this.form.reset(
          {
            fullName: emp.fullName ?? '',
            position: emp.position ?? '',
            isActive: !!emp.isActive,
            userId: emp.userId ? emp.userId : null,
          },
          { emitEvent: false },
        );
      } else {
        this.form.reset(
          {
            fullName: '',
            position: '',
            isActive: true,
            userId: null,
          },
          { emitEvent: false },
        );
      }

      this.form.markAsPristine();
      this.form.markAsUntouched();
    });
  }

  isInvalid(ctrl: AbstractControl<any>): boolean {
    return ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  fullNameError(): string {
    if (!this.isInvalid(this.fullName)) return '';
    if (this.fullName.hasError('required')) return 'Nama wajib diisi.';
    if (this.fullName.hasError('whitespaceOnly')) return 'Nama tidak boleh hanya spasi.';
    if (this.fullName.hasError('minlength')) return 'Nama minimal 2 karakter.';
    if (this.fullName.hasError('maxlength')) return 'Nama maksimal 64 karakter.';
    return 'Nama tidak valid.';
  }

  positionError(): string {
    if (!this.isInvalid(this.position)) return '';
    if (this.position.hasError('required')) return 'Posisi wajib diisi.';
    if (this.position.hasError('whitespaceOnly')) return 'Posisi tidak boleh hanya spasi.';
    if (this.position.hasError('minlength')) return 'Posisi minimal 2 karakter.';
    if (this.position.hasError('maxlength')) return 'Posisi maksimal 64 karakter.';
    return 'Posisi tidak valid.';
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const emp = this.employee();

    this.save.emit({
      id: emp?.id,
      fullName: v.fullName.trim(),
      position: v.position.trim(),
      isActive: !!v.isActive,
      userId: v.userId ? v.userId : null,
    });
  }

  private noWhitespaceOnly(field: 'fullName' | 'position') {
    return (group: AbstractControl): ValidationErrors | null => {
      const ctrl = group.get(field);
      const raw = (ctrl?.value ?? '').toString();
      const onlySpaces = raw.length > 0 && raw.trim().length === 0;

      if (!ctrl) return null;

      const existing = { ...(ctrl.errors ?? {}) };

      if (onlySpaces) {
        existing['whitespaceOnly'] = true;
        ctrl.setErrors(existing);
        return null;
      }

      if (existing['whitespaceOnly']) {
        delete existing['whitespaceOnly'];
        ctrl.setErrors(Object.keys(existing).length ? existing : null);
      }

      return null;
    };
  }
}

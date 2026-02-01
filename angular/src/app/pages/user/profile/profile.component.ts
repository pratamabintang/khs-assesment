import { Component, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';

import { FormComponent } from '../../auth/form/form.component';
import { UserService } from '../user.service';
import { UserExposeDto } from '../dto/user-expose.dto';
import { PatchUserPayload } from '../dto/user-patch.dto';
import { RegionSelectorComponent } from '../../auth/register/region-selector.component';

type Initial = {
  nama: string;
  phoneNumber: string;
  fullAddress: string;
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgClass, FormComponent, RegionSelectorComponent],
  templateUrl: './profile.template.html',
})
export class ProfileComponent {
  private userService = inject(UserService);

  @ViewChild(RegionSelectorComponent) regionSelector?: RegionSelectorComponent;

  user = signal<UserExposeDto | null>(null);
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  private initial = signal<Initial | null>(null);

  private readonly PHONE_REGEX = /^(?:\+?62|0)8\d{7,12}$/;

  form = new FormGroup(
    {
      nama: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(64)],
      }),

      phoneNumber: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(this.PHONE_REGEX),
          Validators.maxLength(16),
        ],
      }),

      provinceId: new FormControl<string | null>(null),
      regencyId: new FormControl<string | null>(null),
      districtId: new FormControl<string | null>(null),
      villageId: new FormControl<string | null>(null),

      fullAddress: new FormControl<string | null>(null, {
        validators: [Validators.maxLength(64)],
      }),
    },
    { validators: [this.regionStepValidator()] },
  );

  private trim(v: string | null | undefined): string {
    return (v ?? '').trim();
  }

  regionEdited = computed(() => {
    const v = this.form.getRawValue();
    return !!(v.provinceId || v.regencyId || v.districtId || v.villageId);
  });

  get nama() {
    return this.form.controls.nama;
  }
  get phoneNumber() {
    return this.form.controls.phoneNumber;
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
  get fullAddress() {
    return this.form.controls.fullAddress;
  }

  get phoneError(): string {
    if (!this.isInvalid(this.phoneNumber)) return '';
    if (this.phoneNumber.hasError('required')) return 'No. HP wajib diisi.';
    if (this.phoneNumber.hasError('pattern'))
      return 'Format no HP mengikuti standar +62812xxxx atau 0812xxxx (min digit terpenuhi).';
    return 'No. HP tidak valid.';
  }

  get addressError(): string {
    const touched = this.fullAddress.touched || this.fullAddress.dirty;
    const groupErr = this.form.errors?.['regionRequired'];
    if (!touched && !groupErr) return '';
    if (groupErr) return 'Jika mengubah daerah, alamat lengkap wajib diisi.';
    if (this.fullAddress.hasError('maxlength')) return 'Alamat maksimal 64 karakter.';
    if (this.fullAddress.hasError('required')) return 'Alamat lengkap wajib diisi.';
    return '';
  }

  ngOnInit() {
    this.reload();
  }

  reload(): void {
    this.errorMsg.set('');
    this.successMsg.set('');
    this.loading.set(true);

    this.userService
      .profile()
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError(() => {
          this.errorMsg.set('Gagal memuat profile.');
          return of(null);
        }),
      )
      .subscribe((u) => {
        if (!u) return;

        this.user.set(u);

        const init: Initial = {
          nama: u.name ?? '',
          phoneNumber: u.phoneNumber ?? '',
          fullAddress: u.fullAddress ?? '',
        };
        this.initial.set(init);

        this.form.patchValue(
          {
            nama: init.nama,
            phoneNumber: init.phoneNumber,
            fullAddress: init.fullAddress,

            provinceId: null,
            regencyId: null,
            districtId: null,
            villageId: null,
          },
          { emitEvent: false },
        );

        this.form.updateValueAndValidity({ emitEvent: false });
        this.form.markAsPristine();
        this.form.markAsUntouched();
      });
  }

  save(): void {
    this.errorMsg.set('');
    this.successMsg.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const init = this.initial();
    const u = this.user();
    if (!init || !u) return;

    const v = this.form.getRawValue();
    const payload: Partial<PatchUserPayload> = {};

    const namaNow = this.trim(v.nama);
    if (namaNow && namaNow !== this.trim(init.nama)) payload.name = namaNow;

    const phoneNow = this.trim(v.phoneNumber);
    if (phoneNow && phoneNow !== this.trim(init.phoneNumber)) payload.phoneNumber = phoneNow;

    const fullAddressNow = this.trim(v.fullAddress);
    if (this.regionEdited()) {
      if (fullAddressNow && fullAddressNow !== this.trim(init.fullAddress)) {
        payload.fullAddress = fullAddressNow;
      }
    } else {
      if (fullAddressNow && fullAddressNow !== this.trim(init.fullAddress)) {
        payload.fullAddress = fullAddressNow;
      }
    }

    const rs = this.regionSelector;

    if (v.provinceId) {
      const name = rs?.provinces().find((x) => x.id === v.provinceId)?.name;
      if (name) payload.province = name;
    }
    if (v.regencyId) {
      const name = rs?.regencies().find((x) => x.id === v.regencyId)?.name;
      if (name) payload.regency = name;
    }
    if (v.districtId) {
      const name = rs?.districts().find((x) => x.id === v.districtId)?.name;
      if (name) payload.district = name;
    }
    if (v.villageId) {
      const name = rs?.villages().find((x) => x.id === v.villageId)?.name;
      if (name) payload.village = name;
    }

    if (Object.keys(payload).length === 0) {
      this.successMsg.set('Tidak ada perubahan untuk disimpan.');
      return;
    }

    this.loading.set(true);
    this.userService
      .patch(payload as PatchUserPayload)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError(() => {
          this.errorMsg.set('Gagal menyimpan perubahan.');
          return of(null);
        }),
      )
      .subscribe((updated) => {
        if (!updated) return;

        this.user.set(updated);
        this.successMsg.set('Profile berhasil diperbarui.');

        const nextInit: Initial = {
          nama: (updated as any).name ?? v.nama,
          phoneNumber: (updated as any).phoneNumber ?? v.phoneNumber,
          fullAddress: (updated as any).fullAddress ?? init.fullAddress ?? '',
        };
        this.initial.set(nextInit);

        this.form.patchValue(
          {
            nama: nextInit.nama,
            phoneNumber: nextInit.phoneNumber,
            fullAddress: nextInit.fullAddress ?? null,

            provinceId: null,
            regencyId: null,
            districtId: null,
            villageId: null,
          },
          { emitEvent: false },
        );

        this.form.updateValueAndValidity({ emitEvent: false });
        this.form.markAsPristine();
        this.form.markAsUntouched();
      });
  }

  isInvalid(ctrl: FormControl<any>): boolean {
    return ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  private regionStepValidator() {
    return (group: AbstractControl): ValidationErrors | null => {
      const provinceId = group.get('provinceId')?.value as string | null;
      const regencyId = group.get('regencyId')?.value as string | null;
      const districtId = group.get('districtId')?.value as string | null;
      const villageId = group.get('villageId')?.value as string | null;
      const fullAddress = this.trim(group.get('fullAddress')?.value as string | null);

      const anyRegionTouched = !!(provinceId || regencyId || districtId || villageId);
      if (!anyRegionTouched) return null;

      const errors: ValidationErrors = {};
      if (!provinceId) errors['provinceRequired'] = true;
      if (!regencyId) errors['regencyRequired'] = true;
      if (!districtId) errors['districtRequired'] = true;
      if (!villageId) errors['villageRequired'] = true;
      if (!fullAddress) errors['regionRequired'] = true;

      return Object.keys(errors).length ? errors : null;
    };
  }
}

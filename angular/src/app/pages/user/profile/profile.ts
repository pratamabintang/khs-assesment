import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';

import { Form as AppForm } from '../../auth/form/form';
import { UserService } from '../user.service';
import { UserExposeDto } from '../dto/user-expose.dto';
import { PatchUserPayload } from '../dto/user-patch.dto';
import { RegionSelector } from '../../auth/register/region-selector';

type Initial = {
  nama: string;
  email: string;
  phoneNumber: string;

  // kalau backend sudah expose daerah, simpan buat dirty-check:
  province?: string | null;
  regency?: string | null;
  district?: string | null;
  village?: string | null;
  fullAddress?: string | null;
};

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgClass, AppForm, RegionSelector],
  template: `
    <app-form title="Profile" desc="Ubah data akun & alamat perusahaan kamu">
      @if (errorMsg()) {
        <div
          class="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700"
        >
          {{ errorMsg() }}
        </div>
      }

      @if (successMsg()) {
        <div
          class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {{ successMsg() }}
        </div>
      }

      <form class="mt-6" [formGroup]="form" (ngSubmit)="save()">
        <!-- ✅ Wide layout (md+) -->
        <div class="grid gap-6 md:grid-cols-12 md:items-start">
          <!-- LEFT: Account -->
          <section class="space-y-5 md:col-span-6 lg:col-span-7">
            <div class="rounded-2xl border border-slate-200 bg-white p-5">
              <div class="mb-4 flex items-center justify-between">
                <div>
                  <div class="text-sm font-semibold text-slate-900">Data Akun</div>
                  <div class="mt-0.5 text-xs text-slate-500">Nama, nomor HP, dan email.</div>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Nama</label>
                  <input
                    type="text"
                    maxlength="64"
                    placeholder="Nama perusahaan / nama akun"
                    formControlName="nama"
                    class="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2"
                    [ngClass]="{
                      'border-orange-500 focus:border-orange-500 focus:ring-orange-500/20':
                        isInvalid(form.controls.nama),
                      'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20':
                        !isInvalid(form.controls.nama),
                    }"
                  />
                  @if (isInvalid(form.controls.nama)) {
                    <p class="mt-1 text-xs text-orange-600">Nama wajib diisi.</p>
                  }
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">No. HP</label>
                  <input
                    type="tel"
                    maxlength="16"
                    placeholder="+6281234567890"
                    formControlName="phoneNumber"
                    class="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2"
                    [ngClass]="{
                      'border-orange-500 focus:border-orange-500 focus:ring-orange-500/20':
                        isInvalid(form.controls.phoneNumber),
                      'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20':
                        !isInvalid(form.controls.phoneNumber),
                    }"
                  />
                  @if (isInvalid(form.controls.phoneNumber)) {
                    <p class="mt-1 text-xs text-orange-600">No. HP wajib diisi.</p>
                  }
                </div>
              </div>

              <div class="mt-4">
                <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  maxlength="254"
                  placeholder="nama@gmail.com"
                  formControlName="email"
                  class="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2"
                  [ngClass]="{
                    'border-orange-500 focus:border-orange-500 focus:ring-orange-500/20': isInvalid(
                      form.controls.email
                    ),
                    'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20': !isInvalid(
                      form.controls.email
                    ),
                  }"
                />
                @if (isInvalid(form.controls.email)) {
                  <p class="mt-1 text-xs text-orange-600">Email tidak valid.</p>
                }
              </div>
            </div>
          </section>

          <!-- RIGHT: Address -->
          <section class="space-y-5 md:col-span-6 lg:col-span-5">
            <div class="rounded-2xl border border-slate-200 bg-white p-5">
              <div class="mb-4">
                <div class="text-sm font-semibold text-slate-900">Alamat</div>
                <div class="mt-0.5 text-xs text-slate-500">Daerah dan alamat lengkap.</div>
              </div>

              <app-region-selector
                [provinceCtrl]="form.controls.provinceId"
                [regencyCtrl]="form.controls.regencyId"
                [districtCtrl]="form.controls.districtId"
                [villageCtrl]="form.controls.villageId"
              ></app-region-selector>

              <div class="mt-4">
                <label class="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  maxlength="64"
                  placeholder="Jalan, nomor, RT/RW, detail lainnya"
                  formControlName="fullAddress"
                  class="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <!-- Bottom actions on desktop: sticky-ish feel -->
            <div class="rounded-2xl border border-slate-200 bg-white p-4 md:sticky md:top-6">
              <div class="flex gap-3">
                <button
                  type="button"
                  class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 hover:bg-slate-50
                         disabled:opacity-60 disabled:cursor-not-allowed"
                  (click)="resetToLastLoaded()"
                  [disabled]="loading()"
                >
                  Batalkan
                </button>

                <button
                  type="submit"
                  class="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white
                         shadow-lg shadow-indigo-600/20 transition hover:brightness-110 active:brightness-95
                         disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Simpan
                </button>
              </div>
            </div>
          </section>
        </div>

        <!-- ✅ Mobile bottom buttons (optional): kalau mau tetap tampil di bawah untuk mobile -->
        <div class="mt-6 flex gap-3 md:hidden">
          <button
            type="button"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 hover:bg-slate-50
                   disabled:opacity-60 disabled:cursor-not-allowed"
            (click)="resetToLastLoaded()"
            [disabled]="loading()"
          >
            Batalkan
          </button>

          <button
            type="submit"
            class="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white
                   shadow-lg shadow-indigo-600/20 transition hover:brightness-110 active:brightness-95
                   disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Simpan
          </button>
        </div>
      </form>
    </app-form>
  `,
})
export class ProfileComponent {
  private userService = inject(UserService);

  @ViewChild(RegionSelector) regionSelector?: RegionSelector;

  user = signal<UserExposeDto | null>(null);
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  private initial = signal<Initial | null>(null);

  form = new FormGroup({
    nama: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phoneNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),

    provinceId: new FormControl<string | null>(null),
    regencyId: new FormControl<string | null>(null),
    districtId: new FormControl<string | null>(null),
    villageId: new FormControl<string | null>(null),

    fullAddress: new FormControl<string | null>(null),
  });

  private trim(v: string | null | undefined): string {
    return (v ?? '').trim();
  }

  ngOnInit() {
    this.reload();
  }

  reload(): void {
    this.errorMsg.set('');
    this.successMsg.set('');
    this.loading.set(true);

    this.userService
      .me()
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          console.error('[GET /users/me] error', err);
          this.errorMsg.set('Gagal memuat profile.');
          return of(null);
        }),
      )
      .subscribe((u) => {
        if (!u) return;

        this.user.set(u);

        const init: Initial = {
          nama: (u as any).name ?? '',
          email: (u as any).email ?? '',
          phoneNumber: (u as any).phoneNumber ?? '',
          province: (u as any).province ?? null,
          regency: (u as any).regency ?? null,
          district: (u as any).district ?? null,
          village: (u as any).village ?? null,
          fullAddress: (u as any).fullAddress ?? null,
        };
        this.initial.set(init);

        this.form.patchValue(
          {
            nama: init.nama,
            email: init.email,
            phoneNumber: init.phoneNumber,
            fullAddress: init.fullAddress ?? null,

            provinceId: null,
            regencyId: null,
            districtId: null,
            villageId: null,
          },
          { emitEvent: false },
        );

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

    if (v.nama !== init.nama) payload.nama = v.nama;
    if (v.email !== init.email) payload.email = v.email;
    if (v.phoneNumber !== init.phoneNumber) payload.phoneNumber = v.phoneNumber;

    const fullAddressNow = this.trim(v.fullAddress);
    if (fullAddressNow && fullAddressNow !== this.trim(init.fullAddress)) {
      payload.fullAddress = fullAddressNow;
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
      .patchMe(payload as PatchUserPayload)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          console.error('[PATCH /users/me] error', err);
          this.errorMsg.set('Gagal menyimpan perubahan.');
          return of(null);
        }),
      )
      .subscribe((updated) => {
        if (!updated) return;

        this.user.set(updated);
        this.successMsg.set('Profile berhasil diperbarui.');

        const nextInit: Initial = {
          nama: (updated as any).nama ?? v.nama,
          email: (updated as any).email ?? v.email,
          phoneNumber: (updated as any).phoneNumber ?? v.phoneNumber,
          province: (updated as any).province ?? init.province ?? null,
          regency: (updated as any).regency ?? init.regency ?? null,
          district: (updated as any).district ?? init.district ?? null,
          village: (updated as any).village ?? init.village ?? null,
          fullAddress: (updated as any).fullAddress ?? init.fullAddress ?? null,
        };
        this.initial.set(nextInit);

        this.form.patchValue(
          {
            nama: nextInit.nama,
            email: nextInit.email,
            phoneNumber: nextInit.phoneNumber,
            fullAddress: nextInit.fullAddress ?? null,

            provinceId: null,
            regencyId: null,
            districtId: null,
            villageId: null,
          },
          { emitEvent: false },
        );

        this.form.markAsPristine();
        this.form.markAsUntouched();
      });
  }

  resetToLastLoaded(): void {
    this.errorMsg.set('');
    this.successMsg.set('');

    const init = this.initial();
    if (!init) return;

    this.form.patchValue(
      {
        nama: init.nama,
        email: init.email,
        phoneNumber: init.phoneNumber,
        fullAddress: init.fullAddress ?? null,

        provinceId: null,
        regencyId: null,
        districtId: null,
        villageId: null,
      },
      { emitEvent: false },
    );

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  isInvalid(ctrl: FormControl<any>): boolean {
    return ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }
}

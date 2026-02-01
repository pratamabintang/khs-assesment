import { Component, DestroyRef, Input, inject, signal, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, switchMap, tap } from 'rxjs';

import { SelectComponent } from '../../../shared/select/select.component';
import { Region, RegionService } from './region.service';

@Component({
  selector: 'app-region-selector',
  standalone: true,
  imports: [ReactiveFormsModule, SelectComponent],
  templateUrl: './region-selector.template.html',
})
export class RegionSelectorComponent {
  private regionService = inject(RegionService);
  private destroyRef = inject(DestroyRef);

  provinceCtrl = input.required<FormControl<string | null>>();
  regencyCtrl = input.required<FormControl<string | null>>();
  districtCtrl = input.required<FormControl<string | null>>();
  villageCtrl = input.required<FormControl<string | null>>();

  provinces = signal<Region[]>([]);
  regencies = signal<Region[]>([]);
  districts = signal<Region[]>([]);
  villages = signal<Region[]>([]);

  provinceName = computed(() => {
    const id = this.provinceCtrl().value;
    if (!id) return 'Pilih provinsi';
    return this.provinces().find((p) => p.id === id)?.name || 'Pilih provinsi';
  });

  regencyName = computed(() => {
    const id = this.regencyCtrl().value;
    if (!id) return 'Pilih kota/kabupaten';
    return this.regencies().find((r) => r.id === id)?.name || 'Pilih kota/kabupaten';
  });

  districtName = computed(() => {
    const id = this.districtCtrl().value;
    if (!id) return 'Pilih kecamatan';
    return this.districts().find((d) => d.id === id)?.name || 'Pilih kecamatan';
  });

  villageName = computed(() => {
    const id = this.villageCtrl().value;
    if (!id) return 'Pilih kelurahan/desa';
    return this.villages().find((v) => v.id === id)?.name || 'Pilih kelurahan/desa';
  });

  ngOnInit() {
    this.regionService
      .getProvinces()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.provinces.set(data));

    this.regencyCtrl().disable({ emitEvent: false });
    this.districtCtrl().disable({ emitEvent: false });
    this.villageCtrl().disable({ emitEvent: false });

    this.hydrateFromForm();

    this.listenProvinceChanges();
    this.listenRegencyChanges();
    this.listenDistrictChanges();
  }

  private hydrateFromForm(): void {
    const provinceId = this.provinceCtrl().value;
    const regencyId = this.regencyCtrl().value;
    const districtId = this.districtCtrl().value;

    if (!provinceId) {
      this.resetFromRegency();
      return;
    }

    this.regionService
      .getRegencies(provinceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((regs) => {
        this.regencies.set(regs);
        if (regs.length > 0) this.regencyCtrl().enable({ emitEvent: false });

        if (!regencyId || !regs.some((x) => x.id === regencyId)) {
          this.resetFromDistrict();
          return;
        }

        this.regionService
          .getDistricts(regencyId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((dists) => {
            this.districts.set(dists);
            if (dists.length > 0) this.districtCtrl().enable({ emitEvent: false });

            if (!districtId || !dists.some((x) => x.id === districtId)) {
              this.resetFromVillage();
              return;
            }

            this.regionService
              .getVillages(districtId)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((vills) => {
                this.villages.set(vills);
                if (vills.length > 0) this.villageCtrl().enable({ emitEvent: false });
              });
          });
      });
  }

  private listenProvinceChanges(): void {
    this.provinceCtrl()
      .valueChanges.pipe(
        distinctUntilChanged(),
        tap((provinceId) => {
          this.resetFromRegency();
          if (!provinceId) return;
        }),
        filter((provinceId): provinceId is string => !!provinceId),
        switchMap((provinceId) => this.regionService.getRegencies(provinceId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((regs) => {
        this.regencies.set(regs);
        if (regs.length > 0) this.regencyCtrl().enable({ emitEvent: false });
      });
  }

  private listenRegencyChanges(): void {
    this.regencyCtrl()
      .valueChanges.pipe(
        distinctUntilChanged(),
        tap((regencyId) => {
          this.resetFromDistrict();
          if (!regencyId) return;
        }),
        filter((regencyId): regencyId is string => !!regencyId),
        switchMap((regencyId) => this.regionService.getDistricts(regencyId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((dists) => {
        this.districts.set(dists);
        if (dists.length > 0) this.districtCtrl().enable({ emitEvent: false });
      });
  }

  private listenDistrictChanges(): void {
    this.districtCtrl()
      .valueChanges.pipe(
        distinctUntilChanged(),
        tap((districtId) => {
          this.resetFromVillage();
          if (!districtId) return;
        }),
        filter((districtId): districtId is string => !!districtId),
        switchMap((districtId) => this.regionService.getVillages(districtId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((vills) => {
        this.villages.set(vills);
        if (vills.length > 0) this.villageCtrl().enable({ emitEvent: false });
      });
  }

  private resetFromRegency(): void {
    this.regencies.set([]);
    this.resetControl(this.regencyCtrl(), true);
    this.resetFromDistrict();
  }

  private resetFromDistrict(): void {
    this.districts.set([]);
    this.resetControl(this.districtCtrl(), true);
    this.resetFromVillage();
  }

  private resetFromVillage(): void {
    this.villages.set([]);
    this.resetControl(this.villageCtrl(), true);
  }

  private resetControl(ctrl: FormControl<string | null>, disable: boolean): void {
    ctrl.reset(null, { emitEvent: false });
    if (disable) ctrl.disable({ emitEvent: false });
    ctrl.markAsPristine();
    ctrl.markAsUntouched();
  }

  isInvalid(ctrl: FormControl<string | null>): boolean {
    return ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }
}

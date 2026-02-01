import { NgClass } from '@angular/common';
import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [NgClass],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  templateUrl: './select.template.html',
})
export class SelectComponent implements ControlValueAccessor {
  label = input<string>('');
  placeholder = input<string>('Pilih');
  options = input<SelectOption[]>([]);
  invalid = input<boolean>(false);
  errorText = input<string>('');
  disabled = input<boolean>(false);

  selectedValue = signal<string>('');
  private isDisabledInternal = signal<boolean>(false);

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  get isDisabled(): boolean {
    return this.disabled() || this.isDisabledInternal();
  }

  writeValue(val: unknown): void {
    this.selectedValue.set((val ?? '') as string);
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabledInternal.set(isDisabled);
  }

  onSelectChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedValue.set(val);
    this.onChange(val);
  }

  onSelectBlur(): void {
    this.onTouched();
  }
}

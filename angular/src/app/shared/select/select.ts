import { NgClass } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
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
      useExisting: forwardRef(() => Select),
      multi: true,
    },
  ],
  templateUrl: './select.html',
})
export class Select implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Pilih';
  @Input() options: SelectOption[] = [];
  @Input() invalid = false;
  @Input() errorText = '';
  @Input() disabled = false;

  selectedValue = '';
  isDisabledInternal = false;

  private onChange!: (val: string) => void;
  private onTouched!: () => void;

  get isDisabled(): boolean {
    return this.disabled || this.isDisabledInternal;
  }

  writeValue(val: any): void {
    if (val !== null && val !== undefined) {
      this.selectedValue = val;
    }
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabledInternal = isDisabled;
  }

  onSelectChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedValue = val;
    this.onChange(val);
  }

  onSelectBlur(): void {
    this.onTouched();
  }
}

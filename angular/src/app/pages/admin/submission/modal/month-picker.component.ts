import { Component, EventEmitter, input, Input, output, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MonthValue = string;

@Component({
  selector: 'app-month-picker-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './month-picker.template.html',
})
export class MonthPickerComponent {
  open = input.required<boolean>();
  targetLabel = input.required<string>();
  selectedMonth = input.required<MonthValue>();
  initialYear = input.required<number>();

  close = output<void>();
  select = output<MonthValue>();

  year = signal<number>(new Date().getFullYear());

  ngOnInit(): void {
    this.year.set(this.initialYear());
  }

  ngOnChanges(): void {
    this.year.set(this.initialYear());
  }

  months() {
    const y = this.year();
    return [
      { label: 'Jan', value: `${y}-01` },
      { label: 'Feb', value: `${y}-02` },
      { label: 'Mar', value: `${y}-03` },
      { label: 'Apr', value: `${y}-04` },
      { label: 'Mei', value: `${y}-05` },
      { label: 'Jun', value: `${y}-06` },
      { label: 'Jul', value: `${y}-07` },
      { label: 'Agu', value: `${y}-08` },
      { label: 'Sep', value: `${y}-09` },
      { label: 'Okt', value: `${y}-10` },
      { label: 'Nov', value: `${y}-11` },
      { label: 'Des', value: `${y}-12` },
    ];
  }

  isSelected(month: MonthValue): boolean {
    return this.selectedMonth() === month;
  }

  pickCurrentMonth(): void {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    this.select.emit(`${y}-${m}`);
  }
}

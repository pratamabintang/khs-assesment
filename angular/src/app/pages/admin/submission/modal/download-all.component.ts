import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Input, output, Output, signal } from '@angular/core';

export type DownloadAllPayload = {
  from: string;
  to: string;
  idClient?: string;
  idEmployee?: string;
};

@Component({
  selector: 'app-download-all-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './download-all.template.html',
})
export class DownloadAllComponent {
  open = input<boolean>(false);
  from = input.required<string>();
  to = input.required<string>();
  fromLabel = input<string>('');
  toLabel = input<string>('');

  close = output<void>();
  confirm = output<DownloadAllPayload>();

  idClient = signal('');
  idEmployee = signal('');

  onBackdrop(ev: MouseEvent) {
    this.close.emit();
  }

  submit(): void {
    const idClient = this.idClient().trim();
    const idEmployee = this.idEmployee().trim();

    this.confirm.emit({
      from: this.from(),
      to: this.to(),
      idClient: idClient.length ? idClient : undefined,
      idEmployee: idEmployee.length ? idEmployee : undefined,
    });
  }
}

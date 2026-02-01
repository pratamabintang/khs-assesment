import { Component, ElementRef, EventEmitter, output, Output, viewChild } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.template.html',
})
export class ModalComponent {
  private dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  requestClose = output<void>();

  ngAfterViewInit(): void {
    this.dialogEl().nativeElement.showModal();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.requestClose.emit();
    }
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.requestClose.emit();
  }
}

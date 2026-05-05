import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

export type AssignMode = 'client' | 'employee' | 'all';

export type AssignSurveyPayload = {
  surveyId: string;
  mode: AssignMode;
  userId?: string;
  employeeId?: string;
};

@Component({
  selector: 'app-assign-survey-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assign-modal.template.html',
})
export class AssignSurveyModalComponent {
  @Input() open = false;

  @Input() surveyId: string | null = null;
  @Input() surveyTitle: string | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<AssignSurveyPayload>();

  mode = signal<AssignMode>('client');
  idClient = signal('');
  idEmployee = signal('');

  canSubmit(): boolean {
    if (!this.surveyId) return false;

    if (this.mode() === 'client') return this.idClient().trim().length > 0;
    if (this.mode() === 'employee') return this.idEmployee().trim().length > 0;
    return true;
  }

  submit(): void {
    if (!this.surveyId) return;

    const mode = this.mode();
    const idClient = this.idClient().trim();
    const idEmployee = this.idEmployee().trim();

    this.confirm.emit({
      surveyId: this.surveyId,
      mode,
      userId: mode === 'client' ? idClient || undefined : undefined,
      employeeId: mode === 'employee' ? idEmployee || undefined : undefined,
    });
  }
}

import { Component, computed, input, inject } from '@angular/core';
import { Modal } from '../modal';
import { ErrorService } from '../../error.service';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [Modal],
  templateUrl: './error-modal.html',
})
export class ErrorModal {
  private errorService = inject(ErrorService);

  // optional override
  title = input<string>();
  message = input<string | string[]>();

  readonly safeTitle = computed(() => this.title() ?? 'Terjadi Kesalahan');

  // selalu jadi array untuk ditampilkan sebagai list
  readonly safeMessages = computed<string[]>(() => {
    const msg = this.message();

    if (Array.isArray(msg) && msg.length) return msg;
    if (typeof msg === 'string' && msg.trim()) return [msg];

    const fromService = this.errorService.error(); // harus string[]
    if (Array.isArray(fromService) && fromService.length) return fromService;

    return ['Silakan coba lagi.'];
  });

  onClearError(): void {
    this.errorService.clearError();
  }

  async copyError(): Promise<void> {
    const text = `${this.safeTitle()}\n- ${this.safeMessages().join('\n- ')}`;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      console.warn('Clipboard tidak tersedia / tidak diizinkan.');
    }
  }
}

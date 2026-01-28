import { Component, inject, signal } from '@angular/core';
import { ErrorService } from './shared/error.service';
import { ErrorModal } from './shared/modal/error-modal/error-modal';
import { RouterModule } from '@angular/router';
import { DetailsModal } from './shared/modal/details-modal/details-modal';
import { DetailsService } from './shared/details.service';

@Component({
  selector: 'app-root',
  imports: [ErrorModal, RouterModule, DetailsModal],
  templateUrl: './app.html',
})
export class App {
  constructor() {}
  errorService = inject(ErrorService);
  detailsService = inject(DetailsService);

  protected readonly title = signal('karyaHusada');

  error = this.errorService.error;
  details = this.detailsService.detail;
}

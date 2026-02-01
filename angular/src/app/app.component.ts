import { Component, inject, signal } from '@angular/core';
import { ErrorService } from './shared/error.service';
import { ErrorModalComponent } from './shared/modal/error-modal/error-modal.component';
import { RouterModule } from '@angular/router';
import { DetailsModalComponent } from './shared/modal/details-modal/details-modal.component';
import { DetailsService } from './shared/details.service';

@Component({
  selector: 'app-root',
  imports: [ErrorModalComponent, RouterModule, DetailsModalComponent],
  templateUrl: './app.template.html',
})
export class AppComponent {
  errorService = inject(ErrorService);
  detailsService = inject(DetailsService);

  protected readonly title = signal('karyaHusada');

  error = this.errorService.error;
  details = this.detailsService.detail;
}

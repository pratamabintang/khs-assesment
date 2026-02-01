import { Component, computed, input, inject } from '@angular/core';
import { DetailsService } from '../../details.service';
import { ModalComponent } from '../modal.component';
import { SurveyQuestionDetail } from '../../type/survey/survey.type';

@Component({
  selector: 'app-details-modal',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './details-modal.template.html',
})
export class DetailsModalComponent {
  private detailsService = inject(DetailsService);

  title = input<string>();
  data = input<SurveyQuestionDetail[] | null>();

  readonly safeTitle = computed(() => this.title() ?? 'Detail opsi');

  readonly safeDetails = computed<SurveyQuestionDetail[]>(() => {
    const fromInput = this.data();
    if (Array.isArray(fromInput) && fromInput.length) return fromInput;

    const fromService = this.detailsService.detail();
    if (Array.isArray(fromService) && fromService.length)
      return fromService as SurveyQuestionDetail[];

    return [];
  });

  readonly isEmpty = computed(() => this.safeDetails().length === 0);

  onClearDetails(): void {
    this.detailsService.clearDetails();
  }
}

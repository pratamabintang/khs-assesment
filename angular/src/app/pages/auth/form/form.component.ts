import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form.template.html',
})
export class FormComponent {
  title = input<string>('');
  desc = input<string>('');
}

import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-auth',
  imports: [RouterModule],
  standalone: true,
  templateUrl: './auth.template.html',
  host: {
    class: 'min-h-screen grid grid-cols-1 lg:grid-cols-5 bg-slate-50',
  },
})
export class AuthComponent {}

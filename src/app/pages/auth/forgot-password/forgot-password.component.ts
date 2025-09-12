import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private api = inject(ApiService);
  model = { email: '' };
  submitted = false;
  loading = false;
  error = '';

  onSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    if (!this.model.email) return;
    this.loading = true;
    this.api.forgotPassword({ email: this.model.email }).subscribe({
      next: () => {
        this.loading = false;
        this.submitted = true;
      },
      error: (err) => {
        this.loading = false;
        this.error =
          (err?.error && (err.error.message || err.error)) || 'Failed to send reset link';
      },
    });
  }
}

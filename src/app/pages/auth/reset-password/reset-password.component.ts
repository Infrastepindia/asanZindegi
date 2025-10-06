import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  model = { email: '', token: '', newPassword: '' };
  loading = false;
  error = '';
  success = false;

  onSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    if (!this.model.email || !this.model.token || !this.model.newPassword) return;
    this.loading = true;
    this.api
      .resetPassword({
        email: this.model.email,
        token: this.model.token,
        newPassword: this.model.newPassword,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.success = true;
        },
        error: (err) => {
          this.loading = false;
          this.error = (err?.error && (err.error.message || err.error)) || 'Reset failed';
        },
      });
  }

  goLogin() {
    this.router.navigateByUrl('/login');
  }
}

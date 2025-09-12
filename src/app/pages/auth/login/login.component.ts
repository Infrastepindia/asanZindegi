import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private router = inject(Router);
  private api = inject(ApiService);

  loginMode: 'password' | 'otp' = 'password';
  otpSent = false;
  model = { email: '', password: '', phone: '', otp: '' };
  loading = false;
  error = '';

  onSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    if (this.loginMode === 'otp') {
      if (!this.otpSent) return;
      const valid = /^\d{6}$/.test(this.model.otp || '');
      if (valid) {
        this.router.navigateByUrl('/');
      }
      return;
    }
    if (!this.model.email || !this.model.password) return;
    this.loading = true;
    this.api.login({ email: this.model.email, password: this.model.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.loading = false;
        const e = this.api.extractError(err);
        this.error = e.message || 'Login failed';
      },
    });
  }

  sendOtp() {
    if (!this.model.phone) return;
    this.otpSent = true;
  }
}

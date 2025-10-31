import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

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
  private authService = inject(AuthService);

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
      next: (response: any) => {
        this.loading = false;
        this.storeUserData(response);
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.loading = false;
        const e = this.api.extractError(err);
        this.error = e.message || 'Login failed';
      },
    });
  }

  private storeUserData(response: any): void {
    if (response && typeof response === 'object') {
      const user = {
        id: response.id || response.userId || response.user?.id || '',
        firstName: response.firstName || response.user?.firstName || '',
        lastName: response.lastName || response.user?.lastName || '',
        email: response.email || this.model.email,
        ...response,
      };
      this.authService.setUser(user);
    }
  }

  sendOtp() {
    if (!this.model.phone) return;
    this.otpSent = true;
  }
}

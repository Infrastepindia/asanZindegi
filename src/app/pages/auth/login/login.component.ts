import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private router = inject(Router);

  loginMode: 'password' | 'otp' = 'password';
  otpSent = false;
  model = { email: '', password: '', phone: '', otp: '' };

  onSubmit(e: Event) {
    e.preventDefault();
    if (this.loginMode === 'otp') {
      if (!this.otpSent) return;
      const valid = /^\d{6}$/.test(this.model.otp || '');
      if (valid) {
        this.router.navigateByUrl('/');
      }
      return;
    }
    // Email/password flow (not wired to backend in this demo)
  }

  sendOtp() {
    if (!this.model.phone) return;
    this.otpSent = true;
  }
}

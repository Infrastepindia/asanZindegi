import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  private readonly accounts = inject(AccountService);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);

  model = { name: '', email: '', password: '', confirmPassword: '' };
  loading = false;
  error = '';
  success = '';

  private passwordsMatch() {
    return (this.model.password || '') === (this.model.confirmPassword || '');
  }

  onSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.success = '';
    if (!this.passwordsMatch()) {
      this.error = 'Passwords do not match';
      return;
    }
    const payload = {
      fullName: this.model.name,
      email: this.model.email,
      phone: this.model.password,
    };
    this.loading = true;
    this.accounts.registerIndividual(payload).subscribe({
      next: (resp: any) => {
        this.loading = false;
        if (resp && typeof resp === 'object' && typeof resp.status_code === 'number' && resp.status_code >= 400) {
          this.error = resp.message || 'Registration failed';
          return;
        }
        const msg = (resp && typeof resp === 'object' && typeof resp.message === 'string' && resp.message) || 'Account created successfully.';
        this.success = msg;
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (err) => {
        this.loading = false;
        const e = this.api.extractError(err);
        this.error = e.message || 'Registration failed';
      },
    });
  }
}

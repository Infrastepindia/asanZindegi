import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
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

  model = { name: '', email: '', password: '' };
  submitting = false;
  successMessage = '';
  errorMessage = '';

  private markAllAsTouched(form: NgForm) {
    Object.values(form.controls).forEach((c: any) => c.markAsTouched());
  }

  onSubmit(e: Event, form?: NgForm) {
    e.preventDefault();
    if (!form) return;
    if (form.invalid) {
      this.markAllAsTouched(form);
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.submitting = true;

    const payload = {
      fullName: this.model.name,
      email: this.model.email,
      phone: this.model.password, // API expects `password` in body; AccountService maps from `phone`
    };

    this.accounts.registerIndividual(payload).subscribe({
      next: (res: { body: any; status: number }) => {
        const httpOk = res?.status === 200;
        const code = typeof res?.body?.status_code === 'number' ? res.body.status_code : 200;
        if (httpOk && code === 200) {
          this.successMessage =
            (res.body && (res.body.message || res.body.status_message)) ||
            'Registration successful. Please login.';
          this.submitting = false;
          setTimeout(() => this.router.navigate(['/login']), 1000);
        } else {
          this.errorMessage =
            res?.body?.message || res?.body?.status_message || 'Registration failed';
          this.submitting = false;
        }
      },
      error: (err) => {
        const parsed = this.api.extractError(err);
        this.errorMessage = parsed.message || 'Registration failed';
        this.submitting = false;
      },
    });
  }
}

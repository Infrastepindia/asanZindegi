import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';

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

  model = { name: '', email: '', password: '', confirmPassword: '' };
  loading = false;
  error = '';

  private passwordsMatch() {
    return (this.model.password || '') === (this.model.confirmPassword || '');
  }

  onSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
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
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
    });
  }
}

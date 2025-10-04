import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../../services/account.service';

@Component({
  selector: 'app-provider-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './provider-register.component.html',
  styleUrl: './provider-register.component.css',
})
export class ProviderRegisterComponent {
  private router = inject(Router);
  private accounts = inject(AccountService);

  type: 'Individual' | 'Company' = 'Individual';

  individual = { fullName: '', email: '', phone: '' };
  company = { companyName: '', contactName: '', email: '', phone: '' };

  submit(e: Event) {
    e.preventDefault();
    if (this.type === 'Individual') {
      this.accounts.registerIndividual(this.individual).subscribe({
        next: () => this.router.navigate(['/provider/dashboard']),
        error: () => this.router.navigate(['/provider/dashboard']),
      });
    } else {
      this.accounts.registerCompany(this.company);
      this.router.navigate(['/provider/dashboard']);
    }
  }
}

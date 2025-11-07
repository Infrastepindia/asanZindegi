import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { AccountService } from '../../../services/account.service';
import { CityService } from '../../../shared/city.service';
import { CompanyAccount, IndividualAccount } from '../../../models/provider-account.model';

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
  private accountService = inject(AccountService);
  private cityService = inject(CityService);

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
        this.cityService.clearCity();
        this.router.navigateByUrl('/home');
      }
      return;
    }
    if (!this.model.email || !this.model.password) return;
    this.loading = true;
    this.api.login({ email: this.model.email, password: this.model.password }).subscribe({
      next: (response: any) => {
        this.storeUserData(response);
        this.fetchAndSetAccountData().then(() => {
          this.loading = false;
          this.cityService.clearCity();
          this.router.navigateByUrl('/home');
        });
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
      // Extract user data from nested structure (data.userData)
      const userData = response.data?.userData || response.data || response;
      const user = {
        id: userData.udId || userData.id || response.id || userData.userId || response.userId || '',
        firstName: userData.firstName || response.firstName || userData.first_name || '',
        lastName: userData.lastName || response.lastName || userData.last_name || '',
        email: userData.email || response.email || this.model.email,
        type: response.data.role,
        userData: userData,
        ...userData,
      };
      this.authService.setUser(user);
    }
  }

  private fetchAndSetAccountData(): Promise<void> {
    return new Promise((resolve) => {
      const userId = this.authService.getUserId();
      if (userId) {
        this.api.getCompanyDetails(userId).subscribe({
          next: (response: any) => {
            if (response && response.data) {
              const data = response.data;
              if (data.isCompany) {
                const companyAccount: CompanyAccount = {
                  id: data.providerId || 1,
                  type: 'Company',
                  companyName: data.providerName || '',
                  contactName: data.contactName || data.providerName || '',
                  email: data.email || '',
                  phone: data.phone || '',
                  personnel: [],
                  verification: {
                    status: data.isActive ? 'Verified' : 'Unverified',
                  },
                  createdAt: data.audit?.createdDate || new Date().toISOString(),
                };
                this.accountService.setAccount(companyAccount);
              } else {
                const individualAccount: IndividualAccount = {
                  id: data.providerId || 1,
                  type: 'Individual',
                  fullName: data.providerName || '',
                  email: data.email || '',
                  phone: data.phone || '',
                  createdAt: data.audit?.createdDate || new Date().toISOString(),
                };
                this.accountService.setAccount(individualAccount);
              }
            }
            resolve();
          },
          error: () => {
            resolve();
          },
        });
      } else {
        resolve();
      }
    });
  }

  sendOtp() {
    if (!this.model.phone) return;
    this.otpSent = true;
  }
}

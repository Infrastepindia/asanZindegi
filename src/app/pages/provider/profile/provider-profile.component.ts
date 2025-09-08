import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import {
  CompanyAccount,
  IndividualAccount,
  ProviderAccount,
} from '../../../models/provider-account.model';

@Component({
  selector: 'app-provider-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './provider-profile.component.html',
  styleUrl: './provider-profile.component.css',
})
export class ProviderProfileComponent {
  private accounts = inject(AccountService);
  acc: ProviderAccount | null = null;

  individual: { fullName: string; email: string; phone: string } = {
    fullName: '',
    email: '',
    phone: '',
  };
  company: { companyName: string; contactName: string; email: string; phone: string } = {
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
  };
  verificationNote = '';

  ngOnInit() {
    this.acc = this.accounts.getAccount();
    if (this.acc?.type === 'Individual') {
      const a = this.acc as IndividualAccount;
      this.individual = { fullName: a.fullName, email: a.email, phone: a.phone };
    } else if (this.acc?.type === 'Company') {
      const c = this.acc as CompanyAccount;
      this.company = {
        companyName: c.companyName,
        contactName: c.contactName,
        email: c.email,
        phone: c.phone,
      };
    }
  }

  get isCompany() {
    return this.acc?.type === 'Company';
  }
  get companyAcc(): CompanyAccount | null {
    return this.acc && this.acc.type === 'Company' ? (this.acc as CompanyAccount) : null;
  }
  get individualAcc(): IndividualAccount | null {
    return this.acc && this.acc.type === 'Individual' ? (this.acc as IndividualAccount) : null;
  }

  saveIndividual(e: Event) {
    e.preventDefault();
    const res = this.accounts.updateIndividualProfile(this.individual);
    if (res) this.acc = res;
  }

  saveCompany(e: Event) {
    e.preventDefault();
    const res = this.accounts.updateCompanyProfile(this.company);
    if (res) this.acc = res;
  }

  submitVerification(e: Event) {
    e.preventDefault();
    const res = this.accounts.submitCompanyVerification({ note: this.verificationNote });
    if (res) this.acc = res;
    this.verificationNote = '';
  }

  markVerified() {
    const res = this.accounts.markCompanyVerified();
    if (res) this.acc = res;
  }
}

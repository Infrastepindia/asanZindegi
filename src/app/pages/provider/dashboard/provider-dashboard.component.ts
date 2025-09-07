import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { ProviderAccount, CompanyAccount, IndividualAccount } from '../../../models/provider-account.model';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './provider-dashboard.component.html',
  styleUrl: './provider-dashboard.component.css',
})
export class ProviderDashboardComponent {
  private accounts = inject(AccountService);
  acc: ProviderAccount | null = null;

  person = { name: '', email: '', phone: '' };

  ngOnInit() {
    this.acc = this.accounts.getAccount();
  }

  get isCompany(): boolean {
    return this.acc?.type === 'Company';
  }
  get company(): CompanyAccount | null {
    return this.acc && this.acc.type === 'Company' ? (this.acc as CompanyAccount) : null;
  }
  get individual(): IndividualAccount | null {
    return this.acc && this.acc.type === 'Individual' ? (this.acc as IndividualAccount) : null;
  }

  addPersonnel(e: Event) {
    e.preventDefault();
    const res = this.accounts.addPersonnel(this.person);
    if (res) {
      this.acc = res as CompanyAccount;
      this.person = { name: '', email: '', phone: '' };
    }
  }

  removePersonnel(id: number) {
    const res = this.accounts.removePersonnel(id);
    if (res) this.acc = res as CompanyAccount;
  }
}

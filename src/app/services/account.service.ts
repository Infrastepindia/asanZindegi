import { Injectable } from '@angular/core';
import { ProviderAccount, CompanyAccount, IndividualAccount, Personnel } from '../models/provider-account.model';

const KEY = 'az_account';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private nextPersonnelId = 1;

  getAccount(): ProviderAccount | null {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      const acc = JSON.parse(raw) as ProviderAccount;
      if ((acc as any).personnel) {
        const maxId = Math.max(0, ...((acc as any).personnel as Personnel[]).map(p => p.id));
        this.nextPersonnelId = Math.max(1, maxId + 1);
      }
      return acc;
    } catch {
      return null;
    }
  }

  setAccount(acc: ProviderAccount) {
    localStorage.setItem(KEY, JSON.stringify(acc));
  }

  clearAccount() {
    localStorage.removeItem(KEY);
  }

  registerIndividual(data: { fullName: string; email: string; phone: string }): IndividualAccount {
    const acc: IndividualAccount = {
      id: 1,
      type: 'Individual',
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      createdAt: new Date().toISOString(),
    };
    this.setAccount(acc);
    return acc;
  }

  registerCompany(data: { companyName: string; contactName: string; email: string; phone: string }): CompanyAccount {
    const acc: CompanyAccount = {
      id: 1,
      type: 'Company',
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      personnel: [],
      createdAt: new Date().toISOString(),
    };
    this.setAccount(acc);
    return acc;
  }

  addPersonnel(p: { name: string; email: string; phone: string }): CompanyAccount | null {
    const acc = this.getAccount();
    if (!acc || acc.type !== 'Company') return null;
    const person: Personnel = { id: this.nextPersonnelId++, name: p.name, email: p.email, phone: p.phone };
    acc.personnel.push(person);
    this.setAccount(acc);
    return acc;
  }

  removePersonnel(id: number): CompanyAccount | null {
    const acc = this.getAccount();
    if (!acc || acc.type !== 'Company') return null;
    acc.personnel = acc.personnel.filter(p => p.id !== id);
    this.setAccount(acc);
    return acc;
  }
}

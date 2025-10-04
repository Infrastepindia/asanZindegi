import { Injectable } from '@angular/core';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ProviderAccount,
  CompanyAccount,
  IndividualAccount,
  Personnel,
} from '../models/provider-account.model';

const KEY = 'az_account';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private nextPersonnelId = 1;
  private mem: string | null = null; // SSR-safe fallback

  private http = inject(HttpClient);

  private get storageAvailable() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }
  private storageGet(): string | null {
    if (this.storageAvailable) return window.localStorage.getItem(KEY);
    return this.mem;
  }
  private storageSet(val: string) {
    if (this.storageAvailable) window.localStorage.setItem(KEY, val);
    else this.mem = val;
  }
  private storageClear() {
    if (this.storageAvailable) window.localStorage.removeItem(KEY);
    else this.mem = null;
  }

  getAccount(): ProviderAccount | null {
    const raw = this.storageGet();
    if (!raw) return null;
    try {
      const acc = JSON.parse(raw) as ProviderAccount;
      if ((acc as any).personnel) {
        const maxId = Math.max(0, ...((acc as any).personnel as Personnel[]).map((p) => p.id));
        this.nextPersonnelId = Math.max(1, maxId + 1);
      }
      return acc;
    } catch {
      return null;
    }
  }

  setAccount(acc: ProviderAccount) {
    this.storageSet(JSON.stringify(acc));
  }

  clearAccount() {
    this.storageClear();
  }

  registerIndividual(data: { fullName: string; email: string; phone: string }) {
    const [firstName, ...rest] = (data.fullName || '').trim().split(/\s+/);
    const lastName = rest.join(' ');

    const body = {
      email: data.email,
      firstName: firstName || '',
      lastName: lastName || '',
      password: data.phone,
      role: 'Individual',
      company: ''
    };

    const url = 'api/User/register';
    return this.http.post(url, body).pipe(
      tap(() => {
        const acc: IndividualAccount = {
          id: 1,
          type: 'Individual',
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          createdAt: new Date().toISOString(),
        };
        this.setAccount(acc);
      })
    );
  }

  registerCompany(data: {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
  }): CompanyAccount {
    const acc: CompanyAccount = {
      id: 1,
      type: 'Company',
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      personnel: [],
      verification: { status: 'Unverified' },
      createdAt: new Date().toISOString(),
    };
    this.setAccount(acc);
    return acc;
  }

  addPersonnel(p: { name: string; email: string; phone: string }): CompanyAccount | null {
    const acc = this.getAccount();
    if (!acc || acc.type !== 'Company') return null;
    const person: Personnel = {
      id: this.nextPersonnelId++,
      name: p.name,
      email: p.email,
      phone: p.phone,
    };
    acc.personnel.push(person);
    this.setAccount(acc);
    return acc;
  }

  removePersonnel(id: number): CompanyAccount | null {
    const acc = this.getAccount();
    if (!acc || acc.type !== 'Company') return null;
    acc.personnel = acc.personnel.filter((p) => p.id !== id);
    this.setAccount(acc);
    return acc;
  }

  updatePersonnel(person: Personnel): CompanyAccount | null {
    const acc = this.getAccount();
    if (!acc || acc.type !== 'Company') return null;
    const idx = acc.personnel.findIndex((p) => p.id === person.id);
    if (idx === -1) return acc;
    acc.personnel[idx] = { ...person };
    this.setAccount(acc);
    return acc;
  }

  updateIndividualProfile(data: {
    fullName: string;
    email: string;
    phone: string;
  }): IndividualAccount | null {
    const acc = this.getAccount();
    if (!acc || acc.type !== 'Individual') return null;
    const updated: IndividualAccount = {
      ...acc,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
    } as IndividualAccount;
    this.setAccount(updated);
    return updated;
  }

  updateCompanyProfile(data: {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
  }): CompanyAccount | null {
    const acc = this.getAccount();
    if (!acc || acc.type !== 'Company') return null;
    const updated: CompanyAccount = {
      ...(acc as CompanyAccount),
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
    } as CompanyAccount;
    this.setAccount(updated);
    return updated;
  }

  submitCompanyVerification(data: { note?: string; documents?: string[] }): CompanyAccount | null {
    const acc = this.getAccount();
    if (!acc || acc.type !== 'Company') return null;
    const c = acc as CompanyAccount;
    c.verification = {
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      note: data.note,
    };
    this.setAccount(c);
    return c;
  }

  markCompanyVerified(note?: string): CompanyAccount | null {
    const acc = this.getAccount();
    if (!acc || acc.type !== 'Company') return null;
    const c = acc as CompanyAccount;
    c.verification = {
      status: 'Verified',
      submittedAt: c.verification?.submittedAt,
      verifiedAt: new Date().toISOString(),
      note,
    };
    this.setAccount(c);
    return c;
  }
}

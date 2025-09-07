import { Injectable } from '@angular/core';
import { PostedAd } from '../models/ad.model';
import { AccountService } from './account.service';
import { ProviderAccount, CompanyAccount, IndividualAccount } from '../models/provider-account.model';

const KEY = 'az_ads';
const BASE_ID = 100000; // avoid collisions with generated listings

@Injectable({ providedIn: 'root' })
export class AdsService {
  constructor(private accounts: AccountService) {}

  private load(): PostedAd[] {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as PostedAd[];
    } catch {
      return [];
    }
  }

  private save(all: PostedAd[]) {
    localStorage.setItem(KEY, JSON.stringify(all));
  }

  getAll(): PostedAd[] {
    return this.load();
  }

  getById(id: number): PostedAd | undefined {
    return this.load().find(a => a.id === id);
  }

  addAd(input: Omit<PostedAd, 'id' | 'date' | 'views' | 'rating' | 'verified' | 'verifiedType' | 'accountId' | 'accountType' | 'companyName' | 'contactName' | 'contactEmail' | 'contactPhone'> & { personnelId?: number }): PostedAd | null {
    const account = this.accounts.getAccount();
    if (!account) return null;

    const all = this.load();
    const nextId = BASE_ID + (all.length ? (all[all.length - 1].id - BASE_ID + 1) : 1);

    const provider = this.buildProviderMeta(account, input.personnelId);

    const ad: PostedAd = {
      id: nextId,
      title: input.title,
      category: input.category,
      type: input.type,
      location: input.location,
      price: input.price,
      unit: input.unit,
      cover: input.cover,
      date: new Date().toISOString().slice(0, 10),
      views: 0,
      rating: 5,
      verified: account.type === 'Company',
      verifiedType: account.type === 'Company' ? 'Company' : 'KYC',
      accountId: account.id,
      accountType: account.type,
      companyName: provider.companyName,
      contactName: provider.contactName,
      contactEmail: provider.contactEmail,
      contactPhone: provider.contactPhone,
    };
    all.push(ad);
    this.save(all);
    return ad;
  }

  private buildProviderMeta(account: ProviderAccount, personnelId?: number) {
    if (account.type === 'Company') {
      const company = account as CompanyAccount;
      let contactName = company.contactName;
      let contactEmail = company.email;
      let contactPhone = company.phone;
      if (personnelId) {
        const p = company.personnel.find(x => x.id === personnelId);
        if (p) {
          contactName = p.name;
          contactEmail = p.email;
          contactPhone = p.phone;
        }
      }
      return {
        companyName: company.companyName,
        contactName,
        contactEmail,
        contactPhone,
      };
    } else {
      const ind = account as IndividualAccount;
      return {
        companyName: ind.fullName,
        contactName: ind.fullName,
        contactEmail: ind.email,
        contactPhone: ind.phone,
      };
    }
  }

  getProviderMeta(listingId: number): { companyName: string; contactName: string; contactEmail: string; contactPhone: string } | null {
    const ad = this.getById(listingId);
    if (!ad) return null;
    return {
      companyName: ad.companyName || '',
      contactName: ad.contactName,
      contactEmail: ad.contactEmail,
      contactPhone: ad.contactPhone,
    };
  }
}

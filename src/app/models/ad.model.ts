import type { AccountType } from './provider-account.model';

export interface PostedAd {
  id: number; // unique within posted ads, high-offset used to avoid collisions
  title: string;
  category: string;
  type: 'Sell' | 'Rent' | 'Exchange' | 'Service';
  location: string;
  price: number;
  unit?: string;
  cover: string;
  date: string; // ISO date
  views: number;
  rating: number;
  verified: boolean;
  verifiedType?: 'Company' | 'KYC';
  // Provider association
  accountId: number;
  accountType: AccountType;
  companyName?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

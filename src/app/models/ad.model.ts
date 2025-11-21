import type { AccountType } from './provider-account.model';

export interface PostedAd {
  id: number; // unique within posted ads, high-offset used to avoid collisions
  title: string;
  category: string;
  type: string;
  location: string;
  price: number;
  unit?: string;
  cover: string;
  date: string; // ISO date
  views: number;
  rating: number;
  verified: boolean;
  verifiedType?: string;
  // Provider association
  accountId: number;
  accountType: string;
  companyName?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

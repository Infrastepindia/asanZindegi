export type AccountType = 'Individual' | 'Company' | 'Provider';

export interface Personnel {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface CompanyVerification {
  status: 'Unverified' | 'Pending' | 'Verified';
  submittedAt?: string;
  verifiedAt?: string;
  note?: string;
}

export interface ProviderAccountBase {
  id: number;
  type: AccountType;
  email: string;
  phone: string;
  createdAt: string;
}

export interface IndividualAccount extends ProviderAccountBase {
  type: 'Individual';
  fullName: string;
}

export interface CompanyAccount extends ProviderAccountBase {
  type: 'Company' | 'Provider';  
  companyName: string;
  contactName: string;
  personnel: Personnel[];
  verification: CompanyVerification;
}

export type ProviderAccount = IndividualAccount | CompanyAccount;

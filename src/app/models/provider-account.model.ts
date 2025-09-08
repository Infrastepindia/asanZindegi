export type AccountType = 'Individual' | 'Company';

export interface Personnel {
  id: number;
  name: string;
  email: string;
  phone: string;
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
  type: 'Company';
  companyName: string;
  contactName: string;
  personnel: Personnel[];
}

export type ProviderAccount = IndividualAccount | CompanyAccount;

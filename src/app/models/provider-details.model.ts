export interface ProviderDetailsPayload {
  // Account Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;

  // Address Information
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;

  // Provider Profile
  providerName: string;
  profileTitle?: string;
  isCompany: boolean;

  // Categories
  categoryIds: number[];

  // Service Types
  serviceTypes?: Record<number, string[]>; // key by category id

  // Documents (file names or IDs after upload)
  registrationCertificateFileIds?: string[];
  licenseFileIds?: string[];
  portfolioFileIds?: string[];

  // Profile Image and Logo (file IDs after upload)
  profileImageFileId?: string;
  logoFileId?: string;
}

export interface ProviderDetailsRequest {
  providerDetailsPayload: ProviderDetailsPayload;
  files?: { [key: string]: File[] };
}

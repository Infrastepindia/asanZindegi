# AsanZindegi – API Documentation

This project currently exposes a client-side data layer implemented with Angular services. There is no networked backend API; data is stored locally (localStorage in the browser, with an in-memory fallback during SSR). This document specifies the data models and the callable service APIs used by the application.

If you plan to introduce a real backend (REST/GraphQL) later, these service interfaces can be mapped 1:1 to HTTP endpoints.

---

## Conventions
- Dates are ISO strings (YYYY-MM-DD or full ISO timestamp where noted)
- IDs are integers
- Currency is in generic units; UI is responsible for formatting
- All methods are synchronous and return plain objects/arrays

---

## Data Models

### Category
```ts
interface Category { id: number; name: string }
```

### ServiceType
```ts
interface ServiceType { id: number; name: string; categoryId: number }
```

### Provider Accounts
```ts
type AccountType = 'Individual' | 'Company';

interface Personnel {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface CompanyVerification {
  status: 'Unverified' | 'Pending' | 'Verified';
  submittedAt?: string;
  verifiedAt?: string;
  note?: string;
}

interface ProviderAccountBase {
  id: number;
  type: AccountType;
  email: string;
  phone: string;
  createdAt: string; // ISO timestamp
}

interface IndividualAccount extends ProviderAccountBase {
  type: 'Individual';
  fullName: string;
}

interface CompanyAccount extends ProviderAccountBase {
  type: 'Company';
  companyName: string;
  contactName: string;
  personnel: Personnel[];
  verification: CompanyVerification;
}

type ProviderAccount = IndividualAccount | CompanyAccount;
```

### PostedAd
```ts
interface PostedAd {
  id: number;                 // unique within posted ads
  title: string;
  category: string;
  type: 'Sell' | 'Rent' | 'Exchange' | 'Service';
  location: string;
  price: number;
  unit?: string;              // e.g. 'per day' for Rent, 'per visit' for Service
  cover: string;              // image URL
  date: string;               // ISO date (YYYY-MM-DD)
  views: number;
  rating: number;             // integer 1..5
  verified: boolean;
  verifiedType?: 'Company' | 'KYC';
  // Provider association
  accountId: number;
  accountType: AccountType;
  companyName?: string;       // For Individual, mirrors fullName
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}
```

---

## Services

All services are provided in root and operate on local data:
- localStorage keys: `az_account`, `az_ads`
- SSR-safe behavior: when `window.localStorage` is unavailable, an in-memory variable is used

### AccountService
Purpose: manage provider account state (Individual or Company), company personnel, and verification state.

Key Storage: `az_account`

Methods:
- `getAccount(): ProviderAccount | null`
  - Returns the currently stored account or `null` if none.
- `setAccount(acc: ProviderAccount): void`
  - Persists the provided account object.
- `clearAccount(): void`
  - Removes any stored account.
- `registerIndividual(data: { fullName: string; email: string; phone: string }): IndividualAccount`
  - Creates and stores a new Individual account. Returns the stored account.
- `registerCompany(data: { companyName: string; contactName: string; email: string; phone: string }): CompanyAccount`
  - Creates and stores a new Company account with empty personnel and `Unverified` status.
- `addPersonnel(p: { name: string; email: string; phone: string }): CompanyAccount | null`
  - Adds a personnel entry to the current Company account. Returns updated account or `null` if account is not a Company.
- `removePersonnel(id: number): CompanyAccount | null`
  - Removes a personnel member by id. Returns updated account or `null` if account is not a Company.
- `updatePersonnel(person: Personnel): CompanyAccount | null`
  - Updates an existing personnel entry by `person.id`. Returns updated account or `null`.
- `updateIndividualProfile(data: { fullName: string; email: string; phone: string }): IndividualAccount | null`
  - Updates the Individual profile. Returns updated account or `null` if not Individual.
- `updateCompanyProfile(data: { companyName: string; contactName: string; email: string; phone: string }): CompanyAccount | null`
  - Updates the Company profile. Returns updated account or `null` if not Company.
- `submitCompanyVerification(data: { note?: string; documents?: string[] }): CompanyAccount | null`
  - Sets verification status to `Pending` with `submittedAt` timestamp. Returns updated account or `null`.
- `markCompanyVerified(note?: string): CompanyAccount | null`
  - Sets verification status to `Verified` with `verifiedAt` timestamp. Returns updated account or `null`.

Notes:
- Personnel IDs auto-increment starting at 1; preserved across reloads by scanning current personnel array.

---

### AdsService
Purpose: CRUD for user-posted ads, linked to the current provider account.

Key Storage: `az_ads`

Methods:
- `getAll(): PostedAd[]`
  - Returns all posted ads.
- `getById(id: number): PostedAd | undefined`
  - Returns a single ad by id.
- `getByAccount(accountId: number): PostedAd[]`
  - Returns all ads created by the given `accountId`.
- `addAd(input: Omit<PostedAd, 'id'|'date'|'views'|'rating'|'verified'|'verifiedType'|'accountId'|'accountType'|'companyName'|'contactName'|'contactEmail'|'contactPhone'> & { personnelId?: number }): PostedAd | null`
  - Creates a new ad using the current account context. Auto-fills provider contact details.
  - Returns the created ad, or `null` if no account exists.
  - ID allocation: uses a high base (100000) to avoid collisions with generated catalog listings.
- `updateAd(id: number, changes: Partial<Omit<PostedAd, 'id'|'accountId'|'accountType'>>): PostedAd | null`
  - Applies partial updates to an existing ad by id. Returns updated ad or `null` if not found.
- `removeById(id: number): boolean`
  - Deletes an ad by id. Returns `true` if something was removed, else `false`.
- `getProviderMeta(listingId: number): { companyName: string; contactName: string; contactEmail: string; contactPhone: string } | null`
  - Convenience lookup for provider contact information of an ad.

Notes:
- Provider meta is derived from the current account at creation time. For Companies, you can optionally attach `personnelId` to set contact fields from a selected person.

---

### ListingsService
Purpose: Generate a deterministic, in-memory marketplace catalog for demo/UX with relations across categories, service types, and providers.

Methods:
- `getAll(): ListingItem[]`
  - Returns a generated list of items across categories and types. Deterministic via a seeded PRNG; not persisted.
- `getById(id: number): ListingItem | undefined`
  - Returns a generated catalog item by id.
- `getCategories(): Category[]`
  - Returns the full list of categories.
- `getServiceTypes(): ServiceType[]`
  - Returns the full list of service types.
- `getServiceTypesByCategoryName(name: string): ServiceType[]`
  - Returns service types linked to a category name.
- `getProvidersByCategoryName(name: string): Provider[]`
  - Returns demo providers linked to a category name.
- `getServiceTypesForListing(listingId: number): ServiceType[]`
  - Returns service types related to a generated listing id.

Types used by ListingsService:
```ts
interface ListingItem {
  id: number;
  title: string;
  category: string;
  type: 'Sell' | 'Rent' | 'Exchange' | 'Service';
  location: string;
  price: number;
  unit?: string;
  cover: string;
  date: string;  // ISO date
  views: number;
  rating: number;
  verified: boolean;
  verifiedType?: 'Company' | 'KYC';
}

interface Provider { id: number; name: string; categoryId: number; avatar: string }
```

Notes:
- Generated covers are sourced from Unsplash; replace or proxy as needed for production.
- Price ranges and units are based on category and type.

---

## Example Usages

### Create an Individual, Post an Ad
```ts
const acc = accountService.registerIndividual({
  fullName: 'Alex Doe',
  email: 'alex@example.com',
  phone: '+91 99999 99999',
});

const ad = adsService.addAd({
  title: 'AC Repair – Window Unit',
  category: 'Appliance Repair',
  type: 'Service',
  location: 'Mumbai, India',
  price: 799,
  unit: 'per visit',
  cover: 'https://images.unsplash.com/photo-1581093588401-16c9e6d0147b'
});
```

### Company With Personnel, Post Using a Specific Contact
```ts
const comp = accountService.registerCompany({
  companyName: 'FixIt Co.',
  contactName: 'Riya Sharma',
  email: 'contact@fixit.co',
  phone: '+91 90000 00000',
});

accountService.addPersonnel({ name: 'Aman', email: 'aman@fixit.co', phone: '+91 91111 11111' });

const created = adsService.addAd({
  title: 'Bathroom Leak Fix',
  category: 'Plumbing',
  type: 'Service',
  location: 'Delhi, India',
  price: 1299,
  unit: 'per visit',
  cover: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952',
  personnelId: 1, // Aman will be set as contact
});
```

---

## Migration to a Real Backend
To convert these service APIs into HTTP endpoints, consider this mapping:
- AccountService → `/api/account` routes for registration, profile updates, personnel CRUD, verification flow
- AdsService → `/api/ads` routes for CRUD and lookup
- ListingsService → `/api/catalog` (read-only generated/seeded data or DB-backed)

You can progressively replace the localStorage implementations with HTTP calls while preserving method signatures to avoid refactoring consumers.

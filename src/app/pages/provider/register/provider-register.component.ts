import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { ApiService, ApiSuperCategory } from '../../../services/api.service';
import { OsmAutocompleteComponent } from '../../../shared/osm-autocomplete.component';
import { OtpInputComponent } from '../../../shared/otp-input.component';
import { ProviderDetailsPayload } from '../../../models/provider-details.model';
import { Advertisement } from '../../../models/advertisement.model';

interface AddressForm {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pin: string;
}

interface AccountForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  profileImage?: string; // preview data URL
}

interface ProviderForm {
  name: string; // provider / business
  title: string; // tagline
  isCompany: boolean;
  logo?: string; // preview data URL
}

interface ServiceSelection {
  categories: Array<{ id: number; name: string }>;
  serviceTypes: Record<number, string[]>; // key by category id
  advertisements: Record<number, Advertisement>; // key by category id
}

interface DocumentsForm {
  registrationCert?: string[]; // names only for draft
  licenses?: string[];
  portfolio?: string[];
  advertisementImages?: Record<number, string>; // category id -> filename
}

interface RegistrationDraft {
  step: number;
  account: AccountForm;
  address: AddressForm;
  provider: ProviderForm;
  selection: ServiceSelection;
  documents: DocumentsForm;
}

@Component({
  selector: 'app-provider-register',
  standalone: true,
  imports: [CommonModule, FormsModule, OsmAutocompleteComponent, OtpInputComponent],
  templateUrl: './provider-register.component.html',
  styleUrl: './provider-register.component.css',
})
export class ProviderRegisterComponent {
  private router = inject(Router);
  private accounts = inject(AccountService);
  private api = inject(ApiService);

  private draftKey = 'az_provider_reg_draft';

  steps = [
    'Account Setup',
    'Address Details',
    'Provider Profile',
    'Categories',
    'Service Types',
    'Documents',
    'Review & Submit',
  ];
  step = 1;

  account: AccountForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  };
  phoneVerified = false;
  otpError: string | null = null;
  address: AddressForm = { line1: '', line2: '', city: '', state: '', pin: '' };
  provider: ProviderForm = { name: '', title: '', isCompany: false };

  superCategories: ApiSuperCategory[] = [];
  expandedSuperIds = new Set<number>();
  selection: ServiceSelection = { categories: [], serviceTypes: {}, advertisements: {} };

  // Upload previews (not persisted due to size constraints)
  profileImageFile?: File;
  logoFile?: File;
  regFiles: File[] = [];
  licenseFiles: File[] = [];
  portfolioFiles: File[] = [];
  advertisementImageFiles: Record<number, File> = {};

  ngOnInit() {
    const saved = this.readDraft();
    if (saved) this.loadDraft(saved);
    this.api.getCategories().subscribe({
      next: (res) => (this.superCategories = res?.data || []),
      error: () => (this.superCategories = []),
    });
  }

  // Draft persistence (text fields only)
  writeDraft() {
    const advertisementImages: Record<number, string> = {};
    Object.entries(this.advertisementImageFiles).forEach(([catId, file]) => {
      if (file) {
        advertisementImages[Number(catId)] = file.name;
      }
    });

    const draft: RegistrationDraft = {
      step: this.step,
      account: this.account,
      address: this.address,
      provider: this.provider,
      selection: this.selection,
      documents: {
        registrationCert: this.regFiles.map((f) => f.name),
        licenses: this.licenseFiles.map((f) => f.name),
        portfolio: this.portfolioFiles.map((f) => f.name),
        advertisementImages:
          Object.keys(advertisementImages).length > 0 ? advertisementImages : undefined,
      },
    };
    if (typeof window !== 'undefined')
      window.localStorage.setItem(this.draftKey, JSON.stringify(draft));
  }
  private readDraft(): RegistrationDraft | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(this.draftKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RegistrationDraft;
    } catch {
      return null;
    }
  }
  private loadDraft(d: RegistrationDraft) {
    this.step = d.step || 1;
    this.account = { ...this.account, ...d.account };
    this.address = { ...this.address, ...d.address } as AddressForm;
    this.provider = { ...this.provider, ...d.provider } as ProviderForm;
    this.selection = d.selection || this.selection;
  }
  clearDraft() {
    if (typeof window !== 'undefined') window.localStorage.removeItem(this.draftKey);
  }

  resetForm() {
    if (confirm('Are you sure you want to reset the entire form? This cannot be undone.')) {
      this.step = 1;
      this.account = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      };
      this.phoneVerified = false;
      this.otpError = null;
      this.address = { line1: '', line2: '', city: '', state: '', pin: '' };
      this.provider = { name: '', title: '', isCompany: false };
      this.selection = { categories: [], serviceTypes: {}, advertisements: {} };
      this.profileImageFile = undefined;
      this.logoFile = undefined;
      this.regFiles = [];
      this.licenseFiles = [];
      this.portfolioFiles = [];
      this.advertisementImageFiles = {};
      this.clearDraft();
    }
  }

  // Navigation
  next() {
    if (this.step === 1) {
      if (this.account.password !== this.account.confirmPassword) return;
      if (!this.account.firstName || !this.account.email || !this.account.phone) return;
    }
    if (this.step < this.steps.length) {
      this.step++;
      this.writeDraft();
    }
  }
  back() {
    if (this.step > 1) this.step--;
  }
  goTo(i: number) {
    if (i >= 1 && i <= this.steps.length) this.step = i;
  }

  // Helpers
  get fullName() {
    return `${this.account.firstName} ${this.account.lastName}`.trim();
  }
  isCategorySelected(id: number) {
    return this.selection.categories.some((c) => c.id === id);
  }
  toggleCategory(c: { id: number; name: string }) {
    const idx = this.selection.categories.findIndex((x) => x.id === c.id);
    if (idx >= 0) this.selection.categories.splice(idx, 1);
    else this.selection.categories.push(c);
    this.writeDraft();
  }
  serviceTypesFor(catId: number): string[] {
    return this.selection.serviceTypes[catId] || [];
  }
  addServiceType(catId: number, input: HTMLInputElement) {
    const val = (input.value || '').trim();
    if (!val) return;
    const arr = this.selection.serviceTypes[catId] || [];
    if (!arr.includes(val)) arr.push(val);
    this.selection.serviceTypes[catId] = arr;
    input.value = '';
    this.writeDraft();
  }
  removeServiceType(catId: number, name: string) {
    const arr = this.selection.serviceTypes[catId] || [];
    this.selection.serviceTypes[catId] = arr.filter((s) => s !== name);
    this.writeDraft();
  }

  getAdvertisement(catId: number, catName: string): Advertisement {
    if (!this.selection.advertisements[catId]) {
      this.selection.advertisements[catId] = {
        categoryId: catId,
        categoryName: catName,
        priceStartForm: '',
        priceType: '',
        serviceOverview: '',
        detailDescription: '',
      };
    }
    return this.selection.advertisements[catId];
  }

  // File handlers (store previews only)
  async onProfileImage(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.profileImageFile = f;
    this.account.profileImage = await this.readAsDataURL(f);
  }
  async onLogo(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.logoFile = f;
    this.provider.logo = await this.readAsDataURL(f);
  }
  onFiles(kind: 'reg' | 'lic' | 'port', e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    if (kind === 'reg') this.regFiles = files;
    if (kind === 'lic') this.licenseFiles = files;
    if (kind === 'port') this.portfolioFiles = files;
    this.writeDraft();
  }

  async onAdvertisementImage(catId: number, e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.advertisementImageFiles[catId] = f;
    const ad = this.selection.advertisements[catId];
    if (ad) {
      ad.advertisementImage = await this.readAsDataURL(f);
    }
    this.writeDraft();
  }
  private readAsDataURL(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(String(reader.result || ''));
      reader.onerror = rej;
      reader.readAsDataURL(f);
    });
  }

  onOtpRequest() {
    this.otpError = null;
  }
  onOtpVerify(code: string) {
    // Frontend-only acceptance; integrate API later
    this.phoneVerified = code.length === 6;
    this.otpError = this.phoneVerified ? null : 'Invalid code';
  }

  // Submit
  submit() {
    if (!this.validateAllSteps()) {
      alert('Please complete all required fields.');
      return;
    }

    const advertisements = Object.values(this.selection.advertisements).map((ad) => {
      const adPayload: any = {
        categoryId: ad.categoryId,
        categoryName: ad.categoryName,
        priceStartForm: ad.priceStartForm,
        priceType: ad.priceType,
        serviceOverview: ad.serviceOverview,
        areaCoveredPolygon: ad.areaCoveredPolygon,
        videoLink: ad.videoLink,
        detailDescription: ad.detailDescription,
        availabilityHours: ad.availabilityHours,
      };

      // Attach advertisement images for this category
      const categoryImages = this.advertisementImageFiles[ad.categoryId];
      if (categoryImages) {
        adPayload.images = [categoryImages];
      }

      return adPayload;
    });

    const payload: ProviderDetailsPayload = {
      firstName: this.account.firstName,
      lastName: this.account.lastName,
      email: this.account.email,
      phone: this.account.phone,
      password: this.account.password,

      addressLine1: this.address.line1,
      addressLine2: this.address.line2,
      city: this.address.city,
      state: this.address.state,
      pinCode: this.address.pin,

      providerName: this.provider.name,
      profileTitle: this.provider.title,
      isCompany: this.provider.isCompany,

      categoryIds: this.selection.categories.map((c) => c.id),
      advertisements: advertisements.length > 0 ? advertisements : undefined,
    };

    const files = {
      profileImage: this.profileImageFile,
      logo: this.logoFile,
      registrationCertificates: this.regFiles.length > 0 ? this.regFiles : undefined,
      licenses: this.licenseFiles.length > 0 ? this.licenseFiles : undefined,
      portfolio: this.portfolioFiles.length > 0 ? this.portfolioFiles : undefined,
    };

    this.api.addProviderDetails(payload, files).subscribe({
      next: (response) => {
        this.clearDraft();
        alert('Provider registration submitted successfully!');
        this.router.navigate(['/provider/dashboard']);
      },
      error: (err) => {
        const errorInfo = this.api.extractError(err);
        alert(`Submission failed: ${errorInfo.message}`);
      },
    });
  }

  private validateAllSteps(): boolean {
    if (!this.account.firstName || !this.account.email || !this.account.phone) {
      return false;
    }
    if (this.account.password !== this.account.confirmPassword) {
      return false;
    }
    if (!this.address.line1 || !this.address.city || !this.address.state || !this.address.pin) {
      return false;
    }
    if (!this.provider.name) {
      return false;
    }
    if (this.selection.categories.length === 0) {
      return false;
    }
    return true;
  }
}

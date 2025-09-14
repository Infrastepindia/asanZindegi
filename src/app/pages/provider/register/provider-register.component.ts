import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { ApiService, ApiSuperCategory } from '../../../services/api.service';
import { OsmAutocompleteComponent } from '../../../shared/osm-autocomplete.component';

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
}

interface DocumentsForm {
  registrationCert?: string[]; // names only for draft
  licenses?: string[];
  portfolio?: string[];
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
  imports: [CommonModule, FormsModule, OsmAutocompleteComponent],
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
  address: AddressForm = { line1: '', line2: '', city: '', state: '', pin: '' };
  provider: ProviderForm = { name: '', title: '', isCompany: false };

  superCategories: ApiSuperCategory[] = [];
  expandedSuperIds = new Set<number>();
  selection: ServiceSelection = { categories: [], serviceTypes: {} };

  // Upload previews (not persisted due to size constraints)
  profileImageFile?: File;
  logoFile?: File;
  regFiles: File[] = [];
  licenseFiles: File[] = [];
  portfolioFiles: File[] = [];

  ngOnInit() {
    const saved = this.readDraft();
    if (saved) this.loadDraft(saved);
    this.api.getCategories().subscribe({
      next: (res) => (this.superCategories = res?.data || []),
      error: () => (this.superCategories = []),
    });
  }

  // Draft persistence (text fields only)
  private writeDraft() {
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

  // Navigation
  next() {
    if (this.step === 1 && this.account.password !== this.account.confirmPassword) {
      return;
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
  private readAsDataURL(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(String(reader.result || ''));
      reader.onerror = rej;
      reader.readAsDataURL(f);
    });
  }

  // Submit
  submit() {
    if (this.provider.isCompany) {
      this.accounts.registerCompany({
        companyName: this.provider.name,
        contactName: this.fullName,
        email: this.account.email,
        phone: this.account.phone,
      });
    } else {
      this.accounts.registerIndividual({
        fullName: this.fullName,
        email: this.account.email,
        phone: this.account.phone,
      });
    }
    this.clearDraft();
    this.router.navigate(['/provider/dashboard']);
  }
}

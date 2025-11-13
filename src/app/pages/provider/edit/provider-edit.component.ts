import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ApiService, ApiSuperCategory } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { OsmAutocompleteComponent } from '../../../shared/osm-autocomplete.component';
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
  profileImage?: string;
}

interface ProviderForm {
  name: string;
  title: string;
  isCompany: boolean;
  logo?: string;
}

interface ServiceSelection {
  categories: Array<{ id: number; name: string }>;
  serviceTypes: Record<number, string[]>;
  advertisements: Record<number, Advertisement>;
}

interface DocumentsForm {
  registrationCert?: string[];
  licenses?: string[];
  portfolio?: string[];
  advertisementImages?: Record<number, string>;
}

@Component({
  selector: 'app-provider-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, OsmAutocompleteComponent],
  templateUrl: './provider-edit.component.html',
  styleUrl: './provider-edit.component.css',
})
export class ProviderEditComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private notification = inject(NotificationService);

  loading = true;
  submitting = false;

  steps = [
    'Account Information',
    'Address Details',
    'Provider Profile',
    'Categories',
    'Service Types',
    'Documents',
    'Review & Submit',
  ];
  step = 1;

  providerId: number | null = null;

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
  selection: ServiceSelection = { categories: [], serviceTypes: {}, advertisements: {} };

  profileImageFile?: File;
  logoFile?: File;
  regFiles: File[] = [];
  licenseFiles: File[] = [];
  portfolioFiles: File[] = [];
  advertisementImageFiles: Record<number, File> = {};

  ngOnInit() {
    const user = this.authService.getUser();
    this.providerId = user?.userData?.providerId || user?.userData?.udId || null;

    if (!this.providerId) {
      this.notification.error('Provider ID not found. Please login again.');
      this.router.navigate(['/login']);
      return;
    }

    this.loadProviderData();
    this.api.getCategories().subscribe({
      next: (res) => (this.superCategories = res?.data || []),
      error: () => (this.superCategories = []),
    });
  }

  private loadProviderData() {
    if (!this.providerId) return;

    this.api.getCompanyDetails(this.providerId).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.populateFormWithData(response.data);
        }
        this.loading = false;
      },
      error: (err) => {
        const errorInfo = this.api.extractError(err);
        this.notification.error(`Failed to load provider details: ${errorInfo.message}`);
        this.loading = false;
      },
    });
  }

  private populateFormWithData(data: any) {
    this.account = {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      password: '',
      confirmPassword: '',
      profileImage: data.profileImageUrl || '',
    };

    this.address = {
      line1: data.addressLine1 || '',
      line2: data.addressLine2 || '',
      city: data.city || '',
      state: data.state || '',
      pin: data.pinCode || '',
    };

    this.provider = {
      name: data.providerName || '',
      title: data.profileTitle || '',
      isCompany: data.isCompany || false,
      logo: data.logoUrl || '',
    };

    if (data.categoryIds && Array.isArray(data.categoryIds)) {
      this.selection.categories = this.buildCategoriesFromIds(data.categoryIds);
    }

    if (data.serviceTypes && typeof data.serviceTypes === 'object') {
      this.selection.serviceTypes = data.serviceTypes;
    }

    if (data.advertisements && Array.isArray(data.advertisements)) {
      this.buildAdvertisementsFromData(data.advertisements);
    }
  }

  private buildCategoriesFromIds(ids: number[]): Array<{ id: number; name: string }> {
    const categories: Array<{ id: number; name: string }> = [];
    ids.forEach((id) => {
      for (const superCat of this.superCategories) {
        const found = superCat.categories.find((c) => c.id === id);
        if (found) {
          categories.push({ id: found.id, name: found.name });
        }
      }
    });
    return categories;
  }

  private buildAdvertisementsFromData(advertisements: any[]) {
    advertisements.forEach((ad) => {
      this.selection.advertisements[ad.categoryId] = {
        categoryId: ad.categoryId,
        categoryName: ad.categoryName,
        priceStartForm: ad.priceStartForm || '',
        priceType: ad.priceType || '',
        serviceOverview: ad.serviceOverview || '',
        areaCoveredPolygon: ad.areaCoveredPolygon || '',
        videoLink: ad.videoLink || '',
        detailDescription: ad.detailDescription || '',
        availabilityHours: ad.availabilityHours || '',
        advertisementImage: ad.advertisementImageUrl || '',
      };
    });
  }

  next() {
    if (this.step === 1) {
      if (this.account.password && this.account.password !== this.account.confirmPassword) {
        this.notification.error('Passwords do not match.');
        return;
      }
      if (!this.account.firstName || !this.account.email || !this.account.phone) {
        this.notification.error('Please fill in all required fields.');
        return;
      }
    }
    if (this.step < this.steps.length) {
      this.step++;
    }
  }

  back() {
    if (this.step > 1) this.step--;
  }

  goTo(i: number) {
    if (i >= 1 && i <= this.steps.length) this.step = i;
  }

  get fullName() {
    return `${this.account.firstName} ${this.account.lastName}`.trim();
  }

  isCategorySelected(id: number) {
    return this.selection.categories.some((c) => c.id === id);
  }

  toggleCategory(c: { id: number; name: string }) {
    const idx = this.selection.categories.findIndex((x) => x.id === c.id);
    if (idx >= 0) {
      this.selection.categories.splice(idx, 1);
    } else {
      this.selection.categories.push(c);
    }
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
  }

  removeServiceType(catId: number, name: string) {
    const arr = this.selection.serviceTypes[catId] || [];
    this.selection.serviceTypes[catId] = arr.filter((s) => s !== name);
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
  }

  async onAdvertisementImage(catId: number, e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.advertisementImageFiles[catId] = f;
    const ad = this.selection.advertisements[catId];
    if (ad) {
      ad.advertisementImage = await this.readAsDataURL(f);
    }
  }

  private readAsDataURL(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(String(reader.result || ''));
      reader.onerror = rej;
      reader.readAsDataURL(f);
    });
  }

  submit() {
    if (!this.validateAllSteps()) {
      this.notification.error('Please complete all required fields.');
      return;
    }

    this.submitting = true;

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

      const categoryImages = this.advertisementImageFiles[ad.categoryId];
      if (categoryImages) {
        adPayload.images = [categoryImages];
      }

      return adPayload;
    });

    const payload: ProviderDetailsPayload = {
      providerId: this.providerId || undefined,
      firstName: this.account.firstName,
      lastName: this.account.lastName,
      email: this.account.email,
      phone: this.account.phone,
      password: this.account.password || undefined,

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

    this.api.updateProviderDetails(payload, files).subscribe({
      next: (response) => {
        this.submitting = false;
        this.notification.success('Provider details updated successfully!');
        this.router.navigate(['/provider/dashboard']);
      },
      error: (err) => {
        this.submitting = false;
        const errorInfo = this.api.extractError(err);
        this.notification.error(`Update failed: ${errorInfo.message}`);
      },
    });
  }

  private validateAllSteps(): boolean {
    if (!this.account.firstName || !this.account.email || !this.account.phone) {
      return false;
    }
    if (this.account.password && this.account.password !== this.account.confirmPassword) {
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

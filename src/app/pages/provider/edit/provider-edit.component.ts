import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ApiService, ApiSuperCategory } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { OsmAutocompleteComponent } from '../../../shared/osm-autocomplete.component';
import { GoogleAutocompleteComponent } from '../../../shared/google-autocomplete.component';
import { ProviderDetailsPayload } from '../../../models/provider-details.model';
import { Advertisement } from '../../../models/advertisement.model';
import { environment } from '../../../../environments/environment';

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

interface FileWithUrl {
  name: string;
  url: string;
  file?: File;
}

@Component({
  selector: 'app-provider-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, OsmAutocompleteComponent, GoogleAutocompleteComponent],
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
    'Account Setup',
    'Address Details',
    'Provider Profile',
    'Categories',
    'Service Types',
    'Documents',
    'Review & Submit',
  ];
  step = 1;

  providerId: any = null;

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
  regFiles: (FileWithUrl | { name: string; url: string })[] = [];
  licenseFiles: (FileWithUrl | { name: string; url: string })[] = [];
  portfolioFiles: (FileWithUrl | { name: string; url: string })[] = [];
  advertisementImageFiles: Record<number, (FileWithUrl | { name: string; url: string })[]> = {};

  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit() {
    const user = this.authService.getUser();
    this.providerId = this.authService.getUserId();

    if (!this.providerId) {
      this.notification.error('Provider ID not found. Please login again.');
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }


    this.api.getCategories().subscribe({
      next: (res) => {
        (this.superCategories = res?.data || [])
        if (this.superCategories.length > 0) {
          this.loadProviderData();
        }
      },
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
        this.cd.detectChanges();
      },
      error: (err) => {
        const errorInfo = this.api.extractError(err);
        this.notification.error(`Failed to load provider details: ${errorInfo.message}`);
        this.cd.detectChanges();
        this.loading = false;
      },
    });
  }

  private populateFormWithData(data: any) {
    this.account = {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.contactInfo.emailId || '',
      phone: data.contactInfo.phoneNumber || '',
      password: '',
      confirmPassword: '',
      profileImage: environment.file_path + "/" + data.profileImageUrl || '',
    };

    this.address = {
      line1: data.addressInfo.addressLine1 || '',
      line2: data.addressInfo.addressLine2 || '',
      city: data.addressInfo.city || '',
      state: data.addressInfo.state || '',
      pin: data.addressInfo.pin || '',
    };

    this.provider = {
      name: data.providerName || '',
      title: data.profileTitle || '',
      isCompany: data.isCompany || false,
      logo: environment.file_path + "/" + data.logo.url || '',
    };

    if (data.categories && Array.isArray(data.categories)) {
      const scIds = data.categories.map((x: any) => x.scId);
      this.selection.categories = this.buildCategoriesFromIds(scIds);
    }

    if (data.serviceTypes && typeof data.serviceTypes === 'object') {
      this.selection.serviceTypes = data.serviceTypes;
    }

    if (data.advertisements && Array.isArray(data.advertisements)) {
      this.buildAdvertisementsFromData(data.advertisements);
    }

    // Load document files from API
    this.loadDocumentFiles(data);
  }

  private loadDocumentFiles(data: any) {
    // Load registration certificates
    if (data.registrationFile) {
      let regFiles = [data.registrationFile]
      this.regFiles = regFiles.map((f: any) => ({
        name: f.filename,
        url: environment.file_path + "/" + f.url,
      }));
    }

    // Load licenses
    if (data.licenseFile) {
      let licenseFiles = [data.licenseFile]
      this.licenseFiles = licenseFiles.map((l: any) => ({
        name: l.fileName,
        url: environment.file_path + "/" + l.url,
      }));
    }

    // Load portfolio images

    if (data.portfolioFile) {
      let portfolioFiles = [data.portfolioFile]
      this.portfolioFiles = portfolioFiles.map((l: any) => ({
        name: l.fileName,
        url: environment.file_path + "/" + l.url,
      }));
    }

    // Load advertisement images
    // if (data.advertisements && Array.isArray(data.advertisements)) {
    //   data.advertisements.forEach((ad: any) => {
    //     if (ad.advertisementImages && Array.isArray(ad.advertisementImages)) {
    //       this.advertisementImageFiles[ad.categoryId] = ad.advertisementImages.map(
    //         (url: string) => ({
    //           name: this.extractFilenameFromUrl(url),
    //           url: environment.file_path+"/"+url,
    //         }),
    //       );
    //     }
    //   });
    // }

    if (data.advertisements && Array.isArray(data.advertisements)) {
      data.advertisements.forEach((ad: any) => {

        // Ensure object exists
        this.advertisementImageFiles[ad.categoryId] = [];

        // Main image object exists?
        if (ad.mainImage && ad.mainImage.url) {
          this.advertisementImageFiles[ad.categoryId].push({
            name: ad.mainImage.fileName ?? this.extractFilenameFromUrl(ad.mainImage.url),
            url: environment.file_path + "/" + ad.mainImage.url
          });
        }

      });
    }

  }

  private extractFilenameFromUrl(url: string): string {
    if (!url) return 'unknown';
    const parts = url?.split('/');
    const filename = parts[parts.length - 1];
    return filename || 'unknown';
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
        advertisementImage: environment.file_path + "/" + ad.mainImage?.url || '',
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
    const fileWithUrls = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      file: file,
    })) as FileWithUrl[];

    if (kind === 'reg') this.regFiles = fileWithUrls;
    if (kind === 'lic') this.licenseFiles = fileWithUrls;
    if (kind === 'port') this.portfolioFiles = fileWithUrls;
  }

  async onAdvertisementImage(catId: number, e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    if (files.length === 0) return;

    const fileWithUrls: FileWithUrl[] = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        url: await this.readAsDataURL(file),
        file: file,
      })),
    );

    if (!this.advertisementImageFiles[catId]) {
      this.advertisementImageFiles[catId] = [];
    }
    this.advertisementImageFiles[catId] = [
      ...(this.advertisementImageFiles[catId] || []),
      ...fileWithUrls,
    ];

    const ad = this.selection.advertisements[catId];
    if (ad && fileWithUrls.length > 0) {
      ad.advertisementImage = fileWithUrls[0].url;
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

  onPlaceSelected(data: any) {
    if (!data || !data.address) {
      return;
    }

    // Store the full address in line1
    this.address.line1 = data.address;

    // Extract city, state, and pin from Google Places API response if available
    // For now, keep the existing city/state/pin fields for manual entry/editing
    // Users can manually update these fields if needed
  }

  hasUploadedDocuments(): boolean {
    return (
      this.regFiles.length > 0 ||
      this.licenseFiles.length > 0 ||
      this.portfolioFiles.length > 0 ||
      Object.values(this.advertisementImageFiles).some((imgs) => imgs.length > 0)
    );
  }

  getAdvertisementImages(catId: number) {
    return this.advertisementImageFiles[catId] || [];
  }

  getFileIcon(filename: string): string {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf':
        return 'bi-file-pdf';
      case 'doc':
      case 'docx':
        return 'bi-file-word';
      case 'xls':
      case 'xlsx':
        return 'bi-file-spreadsheet';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'bi-file-image';
      default:
        return 'bi-file';
    }
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
      if (categoryImages && categoryImages.length > 0) {
        const imageFiles: File[] = [];
        categoryImages.forEach((img) => {
          if ('file' in img && img.file) {
            imageFiles.push(img.file);
          }
        });
        if (imageFiles.length > 0) {
          adPayload.images = imageFiles;
        }
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

    const regFilesArray: File[] = [];
    const licFilesArray: File[] = [];
    const portFilesArray: File[] = [];

    this.regFiles.forEach((f) => {
      if ('file' in f && f.file) {
        regFilesArray.push(f.file);
      }
    });

    this.licenseFiles.forEach((f) => {
      if ('file' in f && f.file) {
        licFilesArray.push(f.file);
      }
    });

    this.portfolioFiles.forEach((f) => {
      if ('file' in f && f.file) {
        portFilesArray.push(f.file);
      }
    });

    const files: {
      profileImage?: File;
      logo?: File;
      registrationCertificates?: File[];
      licenses?: File[];
      portfolio?: File[];
    } = {
      profileImage: this.profileImageFile,
      logo: this.logoFile,
    };

    if (regFilesArray.length > 0) {
      files.registrationCertificates = regFilesArray;
    }
    if (licFilesArray.length > 0) {
      files.licenses = licFilesArray;
    }
    if (portFilesArray.length > 0) {
      files.portfolio = portFilesArray;
    }

    this.api.updateProviderDetails(payload, files).subscribe({
      next: (response) => {
        console.log(response)
        this.submitting = false;
        window.alert(response.message)
        //response.status_code == 200? this.notification.success(response.message) :this.notification.error(`Update failed: ${response.message}`); ;
        //this.notification.success('Provider details updated successfully!');
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
    if (!this.address.line1) {
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

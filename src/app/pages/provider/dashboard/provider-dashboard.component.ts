import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute, NavigationStart } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { AdsService } from '../../../services/ads.service';
import { ListingsService } from '../../../services/listings.service';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import {
  ProviderAccount,
  CompanyAccount,
  IndividualAccount,
} from '../../../models/provider-account.model';
import { PostedAd } from '../../../models/ad.model';
import { Subscription, filter } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './provider-dashboard.component.html',
  styleUrl: './provider-dashboard.component.css',
})
export class ProviderDashboardComponent implements OnInit, OnDestroy {
  private accounts = inject(AccountService);
  private adsService = inject(AdsService);
  private listingsService = inject(ListingsService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private routerSubscription?: Subscription;

  acc: ProviderAccount | null = null;
  providerAds: (PostedAd & { availabilityHours?: string; detailDescription?: string })[] = [];
  categories = this.listingsService.getCategories();
  isLoading: boolean = false;

  files: {
    [key: string]: Array<{
      fsId: number;
      fileName: string;
      fileType: string;
      filePath: string;
      fileCategory: string;
      url: string;
    }>;
  } = {};

  person = { name: '', email: '', phone: '' };
  editingId: number | null = null;
  editModel = { id: 0, name: '', email: '', phone: '' };

  ngOnInit() {
    this.loadDashboardData();
    this.subscribeToRouteChanges();
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private loadDashboardData(): void {
    const userId = this.authService.getUserId();
    console.log('Provider Dashboard - Retrieved userId:', userId);

    if (userId) {
      this.isLoading = true;
      this.apiService.getCompanyDetails(userId).subscribe({
        next: (response: any) => {
          console.log('Provider Dashboard - API Response:', response);
          if (response && response.data) {
            const data = response.data;

            if (data.isCompany) {
              this.acc = {
                id: data.providerId || 1,
                type: 'Company',
                companyName: data.providerName || '',
                contactName: data.profileTitle || data.providerName || '',
                email: data.email || '',
                phone: data.phone || '',
                personnel: [],
                verification: {
                  status: data.isActive ? 'Verified' : 'Unverified',
                },
                createdAt: data.audit?.createdDate || new Date().toISOString(),
              } as CompanyAccount;
            } else {
              this.acc = {
                id: data.providerId || 1,
                type: 'Individual',
                fullName: data.providerName || '',
                email: data.email || '',
                phone: data.phone || '',
                createdAt: data.audit?.createdDate || new Date().toISOString(),
              } as IndividualAccount;
            }

            if (data.files && typeof data.files === 'object') {
              this.files = data.files;
            }

            if (this.acc && data.advertisements && Array.isArray(data.advertisements)) {
              this.providerAds = data.advertisements.map((ad: any) => {
                const companyName =
                  this.acc!.type === 'Company'
                    ? (this.acc as CompanyAccount).companyName
                    : (this.acc as IndividualAccount).fullName;

                return {
                  id: ad.aId || Math.random(),
                  title: ad.serviceOverview || ad.detailDescription || '',
                  category: ad.categoryName || '',
                  type: 'Service' as const,
                  location: ad.areaCoveredPolygon ? `${ad.areaCoveredPolygon} km radius` : '',
                  price: parseFloat(ad.priceStartForm) || 0,
                  unit: ad.priceType || '',
                  cover: ad.mainImage != null ?  environment.base_path +"/"+ ad.mainImage.url : "",
                  date: new Date().toISOString().slice(0, 10),
                  views: 0,
                  rating: 5,
                  verified: ad.isActive || false,
                  verifiedType: this.acc!.type === 'Company' ? 'Company' : 'KYC',
                  accountId: this.acc!.id,
                  accountType: this.acc!.type,
                  companyName,
                  contactName: companyName,
                  contactEmail: this.acc!.email,
                  contactPhone: this.acc!.phone,
                  availabilityHours: ad.availabilityHours || '',
                  detailDescription: ad.detailDescription || '',
                } as PostedAd & { availabilityHours?: string; detailDescription?: string };
              });
            }

            console.log('Provider Dashboard - Processed Account:', this.acc);
            console.log('Provider Dashboard - Processed Ads:', this.providerAds);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching company details:', error);
          this.isLoading = false;
          this.acc = this.accounts.getAccount();
          if (this.acc) {
            this.providerAds = this.adsService.getByAccount(this.acc.id);
          }
        },
      });
    } else {
      console.warn('No userId found - loading from local storage');
      this.acc = this.accounts.getAccount();
      if (this.acc) {
        this.providerAds = this.adsService.getByAccount(this.acc.id);
      }
      this.isLoading = false;
    }
  }

  private subscribeToRouteChanges(): void {
    this.routerSubscription = this.router.events
      .pipe(
        filter(
          (event) => event instanceof NavigationStart && event.url.includes('provider/dashboard'),
        ),
      )
      .subscribe(() => {
        this.loadDashboardData();
      });
  }

  get isCompany(): boolean {
    return this.acc?.type === 'Company';
  }
  get company(): CompanyAccount | null {
    return this.acc && this.acc.type === 'Company' ? (this.acc as CompanyAccount) : null;
  }
  get individual(): IndividualAccount | null {
    return this.acc && this.acc.type === 'Individual' ? (this.acc as IndividualAccount) : null;
  }

  getProviderCategories() {
    const uniqueCategories = new Set(this.providerAds.map((ad) => ad.category));
    return Array.from(uniqueCategories);
  }

  getFileCategories(): string[] {
    return Object.keys(this.files).sort();
  }

  getFilesByCategory(category: string) {
    return this.files[category] || [];
  }

  getImageUrl(file: {
    fsId: number;
    fileName: string;
    fileType: string;
    filePath: string;
    fileCategory: string;
    url: string;
  }): string {
    return environment.base_path +"/"+file.url;
  }

  getCompanyLogo(): string | null {
    const logoFiles = this.files['logo'] || [];
    if (logoFiles.length > 0) {
      return logoFiles[0].url;
    }
    const brandingFiles = this.files['branding'] || [];
    if (brandingFiles.length > 0) {
      return brandingFiles[0].url;
    }
    return null;
  }

  getTotalAds(): number {
    return this.providerAds.length;
  }

  getTotalViews(): number {
    return this.providerAds.reduce((sum, ad) => sum + ad.views, 0);
  }

  getAverageRating(): number {
    if (this.providerAds.length === 0) return 0;
    const totalRating = this.providerAds.reduce((sum, ad) => sum + ad.rating, 0);
    return Math.round((totalRating / this.providerAds.length) * 10) / 10;
  }

  addPersonnel(e: Event) {
    e.preventDefault();
    const res = this.accounts.addPersonnel(this.person);
    if (res) {
      this.acc = res as CompanyAccount;
      this.person = { name: '', email: '', phone: '' };
    }
  }

  removePersonnel(id: number) {
    const res = this.accounts.removePersonnel(id);
    if (res) this.acc = res as CompanyAccount;
  }

  startEdit(p: { id: number; name: string; email: string; phone: string }) {
    this.editingId = p.id;
    this.editModel = { ...p };
  }

  cancelEdit() {
    this.editingId = null;
  }

  saveEdit() {
    const res = this.accounts.updatePersonnel(this.editModel);
    if (res) {
      this.acc = res as CompanyAccount;
      this.editingId = null;
    }
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './provider-dashboard.component.html',
  styleUrl: './provider-dashboard.component.css',
})
export class ProviderDashboardComponent {
  private accounts = inject(AccountService);
  private adsService = inject(AdsService);
  private listingsService = inject(ListingsService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  acc: ProviderAccount | null = null;
  providerAds: PostedAd[] = [];
  categories = this.listingsService.getCategories();
  isLoading = true;

  person = { name: '', email: '', phone: '' };
  editingId: number | null = null;
  editModel = { id: 0, name: '', email: '', phone: '' };

  ngOnInit() {
    const userId = this.authService.getUserId();

    if (userId) {
      this.apiService.getCompanyDetails(userId).subscribe({
        next: (response: any) => {
          if (response && response.data) {
            const data = response.data;

            if (data.isCompany) {
              this.acc = {
                id: data.providerId || 1,
                type: 'Company',
                companyName: data.providerName || '',
                contactName: data.providerName || '',
                email: '',
                phone: '',
                personnel: [],
                verification: {
                  status: 'Verified',
                },
                createdAt: data.audit?.createdDate || new Date().toISOString(),
              } as CompanyAccount;
            } else {
              this.acc = {
                id: data.providerId || 1,
                type: 'Individual',
                fullName: data.providerName || '',
                email: '',
                phone: '',
                createdAt: data.audit?.createdDate || new Date().toISOString(),
              } as IndividualAccount;
            }

            if (this.acc && data.advertisements && Array.isArray(data.advertisements)) {
              this.providerAds = data.advertisements.map((ad: any) => {
                const companyName = this.acc!.type === 'Company' ? (this.acc as CompanyAccount).companyName : (this.acc as IndividualAccount).fullName;

                return {
                  id: ad.aId || Math.random(),
                  title: ad.serviceOverview || '',
                  category: ad.categoryName || '',
                  type: 'Service' as const,
                  location: '',
                  price: parseFloat(ad.priceStartForm) || 0,
                  unit: ad.priceType || '',
                  cover: '',
                  date: new Date().toISOString().slice(0, 10),
                  views: 0,
                  rating: 5,
                  verified: ad.isActive || false,
                  verifiedType: this.acc!.type === 'Company' ? 'Company' : 'KYC',
                  accountId: this.acc!.id,
                  accountType: this.acc!.type,
                  companyName,
                  contactName: companyName,
                  contactEmail: '',
                  contactPhone: '',
                } as PostedAd;
              });
            }
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
      this.acc = this.accounts.getAccount();
      if (this.acc) {
        this.providerAds = this.adsService.getByAccount(this.acc.id);
      }
      this.isLoading = false;
    }
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

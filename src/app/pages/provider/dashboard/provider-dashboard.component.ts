import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { AdsService } from '../../../services/ads.service';
import { ListingsService } from '../../../services/listings.service';
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

  acc: ProviderAccount | null = null;
  providerAds: PostedAd[] = [];
  categories = this.listingsService.getCategories();

  person = { name: '', email: '', phone: '' };
  editingId: number | null = null;
  editModel = { id: 0, name: '', email: '', phone: '' };

  ngOnInit() {
    this.acc = this.accounts.getAccount();
    if (this.acc) {
      this.providerAds = this.adsService.getByAccount(this.acc.id);
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
    const uniqueCategories = new Set(this.providerAds.map(ad => ad.category));
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

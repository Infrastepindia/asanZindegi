import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../services/account.service';
import { AdsService } from '../../services/ads.service';
import { ListingsService } from '../../services/listings.service';
import { CompanyAccount } from '../../models/provider-account.model';

@Component({
  selector: 'app-post-ad',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './post-ad.component.html',
  styleUrl: './post-ad.component.css',
})
export class PostAdComponent {
  private accounts = inject(AccountService);
  private ads = inject(AdsService);
  private router = inject(Router);
  private listings = inject(ListingsService);

  acc = this.accounts.getAccount();
  categories = this.listings.getCategories().map(c => c.name);
  types: Array<'Sell'|'Rent'|'Exchange'|'Service'> = ['Sell','Rent','Exchange','Service'];

  model = {
    title: '',
    category: '',
    type: 'Service' as 'Sell'|'Rent'|'Exchange'|'Service',
    location: '',
    price: 0,
    unit: 'per visit',
    cover: '',
    personnelId: 0,
  };

  ngOnInit() {
    if (!this.acc) return;
    if (this.acc.type === 'Company') {
      const c = this.acc as CompanyAccount;
      if (c.personnel.length) this.model.personnelId = c.personnel[0].id;
    }
  }

  submit(e: Event) {
    e.preventDefault();
    if (!this.acc) return;
    const ad = this.ads.addAd({
      title: this.model.title,
      category: this.model.category,
      type: this.model.type,
      location: this.model.location,
      price: Number(this.model.price),
      unit: this.model.unit || undefined,
      cover: this.model.cover || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop',
      personnelId: this.acc.type === 'Company' ? (this.model.personnelId || undefined) : undefined,
    });
    if (ad) this.router.navigate(['/ad', ad.id]);
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdsService } from '../../services/ads.service';
import { ListingsService } from '../../services/listings.service';
import { AccountService } from '../../services/account.service';
import { PostedAd } from '../../models/ad.model';

@Component({
  selector: 'app-ad-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ad-edit.component.html',
  styleUrl: './ad-edit.component.css',
})
export class AdEditComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ads = inject(AdsService);
  private listings = inject(ListingsService);
  private accounts = inject(AccountService);

  ad: PostedAd | undefined;
  categories = this.listings.getCategories().map((c) => c.name);
  types: Array<'Sell' | 'Rent' | 'Exchange' | 'Service'> = ['Sell', 'Rent', 'Exchange', 'Service'];

  model = {
    title: '',
    category: '',
    type: '',
    location: '',
    price: 0,
    unit: '' as string | undefined,
    cover: '',
  };

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const acc = this.accounts.getAccount();
    if (!id || !acc) return;
    const ad = this.ads.getById(id);
    if (!ad || ad.accountId !== acc.id) {
      this.router.navigate(['/provider/ads']);
      return;
    }
    this.ad = ad;
    this.model = {
      title: ad.title,
      category: ad.category,
      type: ad.type,
      location: ad.location,
      price: ad.price,
      unit: ad.unit,
      cover: ad.cover,
    };
  }

  save(e: Event) {
    e.preventDefault();
    if (!this.ad) return;
    const res = this.ads.updateAd(this.ad.id, {
      title: this.model.title,
      category: this.model.category,
      type: this.model.type,
      location: this.model.location,
      price: Number(this.model.price),
      unit: this.model.unit || undefined,
      cover: this.model.cover,
    });
    if (res) this.router.navigate(['/ad', this.ad.id]);
  }
}

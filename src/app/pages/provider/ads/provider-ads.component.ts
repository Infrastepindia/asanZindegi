import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdsService } from '../../../services/ads.service';
import { AccountService } from '../../../services/account.service';
import { PostedAd } from '../../../models/ad.model';

@Component({
  selector: 'app-provider-ads',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './provider-ads.component.html',
  styleUrl: './provider-ads.component.css',
})
export class ProviderAdsComponent {
  private accounts = inject(AccountService);
  private adsService = inject(AdsService);

  ads: PostedAd[] = [];

  ngOnInit() {
    const acc = this.accounts.getAccount();
    if (!acc) return;
    this.ads = this.adsService.getByAccount(acc.id);
  }

  remove(id: number) {
    this.adsService.removeById(id);
    const acc = this.accounts.getAccount();
    if (acc) this.ads = this.adsService.getByAccount(acc.id);
  }
}

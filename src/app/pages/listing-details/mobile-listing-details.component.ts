import {
  Component,
  inject,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ListingsService, ListingItem } from '../../services/listings.service';
import { AdsService } from '../../services/ads.service';
import { ApiService } from '../../services/api.service';
import { of, Subject } from 'rxjs';
import { PLACEHOLDER_IMAGE } from '../../constants';

@Component({
  selector: 'app-mobile-listing-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mobile-listing-details.component.html',
  styleUrl: './mobile-listing-details.component.css',
})
export class MobileListingDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private svc = inject(ListingsService);
  private ads = inject(AdsService);
  private apiService = inject(ApiService);
  private destroy$ = new Subject<void>();

  item: any;
  listingId: any;
  thumbnails: string[] = [];
  related: ListingItem[] = [];
  provider = {
    name: 'Provider Demo',
    avatar: 'https://i.pravatar.cc/100?img=12',
    memberSince: new Date(2022, 8, 10).toISOString(),
    email: 'provider@example.com',
    phone: '+1 888 888 8888',
  };
  includes: string[] = [];
  overview = '';
  isLoading = false;
  error: string | null = null;
  private failedImages = new Set<string>();

  showPhone = false;
  showEmail = false;
  showProviderInfo = false;

  get serviceTypes(): string[] {
    const cat = this.item?.category || '';
    return cat ? this.svc.getServiceTypesByCategoryName(cat).map((t) => t.name) : [];
  }

  selectedForPricing?: ListingItem;
  private baseRanges: Record<string, [number, number]> = {
    Plumbing: [299, 1499],
    Electrical: [249, 1799],
    Cleaning: [399, 2499],
    Tutoring: [199, 999],
    Carpentry: [349, 1999],
    Painting: [499, 3999],
    Moving: [999, 9999],
    'Appliance Repair': [299, 2499],
  };

  openPrice(item: ListingItem) {
    this.selectedForPricing = item;
  }

  get modalItem(): ListingItem | undefined {
    return this.selectedForPricing || this.item;
  }

  get priceRange(): [number, number] | null {
    const it = this.modalItem;
    if (!it) return null;
    const base = this.baseRanges[it.category] || [199, 1999];
    let [min, max] = base;
    if (it.type === 'Rent') {
      min = Math.round(min * 0.8);
      max = Math.round(max * 0.8);
    } else if (it.type === 'Exchange') {
      min = Math.round(min * 0.6);
      max = Math.round(max * 0.6);
    }
    return [min, max];
  }

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.isLoading = true;
    this.route.paramMap.subscribe((params) => {
      this.listingId = Number(params.get('id'));
      console.log('Listing ID (mobile):', this.listingId);
    });
    if (this.listingId) {
      this.loadAdDetails(this.listingId);
    }
  }

  loadAdDetails(id: any) {
    this.apiService.getListingDetails(id).subscribe((res: any) => {
      if (res && res.data) {
        this.isLoading = false;
        const apiData = res?.data || res;
        if (!apiData || !apiData.id) {
          this.error = 'No data found';
          this.isLoading = false;
          return;
        }

        const baseUrl = 'https://localhost:7139';

        const normalizedCover = apiData.cover
          ? `${baseUrl}${apiData.cover.replace(/\\/g, '/')}`
          : '';

        this.item = {
          id: apiData.id,
          title: apiData.title,
          category: apiData.category,
          type: apiData.type,
          location: apiData.location,
          price: apiData.price,
          unit: apiData.unit,
          cover: normalizedCover,
          date: apiData.date,
          views: apiData.views,
          rating: apiData.rating,
          verified: apiData.verified,
          verifiedType: apiData.verifiedType,
        };

        this.provider = {
          name: apiData.providerName || 'Service Provider',
          email: apiData.providerEmail || 'Hidden',
          phone: apiData.providerPhone || 'Hidden',
          avatar: normalizedCover || 'assets/images/default-avatar.png',
          memberSince: new Date().toISOString(),
        };

        this.thumbnails = normalizedCover ? [normalizedCover] : [];

        this.overview = `Trusted ${this.item.category} service provider offering reliable ${this.item.type} services in ${this.item.location}.`;
        this.includes = ['Inspection', 'Support', 'Service Warranty'];
        this.cd.detectChanges();
        console.log(this.item);
        this.isLoading = false;
      }
    });
  }

  getImageSource(imageUrl: string | undefined): string {
    if (!imageUrl || imageUrl.trim() === '') {
      return PLACEHOLDER_IMAGE;
    }
    if (this.failedImages.has(imageUrl)) {
      return PLACEHOLDER_IMAGE;
    }
    return imageUrl;
  }

  onImageLoadError(imageUrl: string): void {
    if (imageUrl && imageUrl !== PLACEHOLDER_IMAGE) {
      this.failedImages.add(imageUrl);
    }
  }

  toggleProviderInfo() {
    this.showProviderInfo = !this.showProviderInfo;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

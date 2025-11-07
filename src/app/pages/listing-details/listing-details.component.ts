import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ListingsService, ListingItem } from '../../services/listings.service';
import { AdsService } from '../../services/ads.service';
import { ApiService } from '../../services/api.service';
import { Meta } from '@angular/platform-browser';

declare const L: any;

@Component({
  selector: 'app-listing-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './listing-details.component.html',
  styleUrl: './listing-details.component.css',
})
export class ListingDetailsComponent {
  private route = inject(ActivatedRoute);
  private svc = inject(ListingsService);
  private ads = inject(AdsService);
  private apiService = inject(ApiService);
  private platformId = inject(PLATFORM_ID);
  private doc = inject(DOCUMENT);
  private meta = inject(Meta);

  item?: ListingItem;
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

  // Contact visibility flags
  showPhone = false;
  showEmail = false;

  // Service types per category (from service relations)
  get serviceTypes(): string[] {
    const cat = this.item?.category || '';
    return cat ? this.svc.getServiceTypesByCategoryName(cat).map((t) => t.name) : [];
  }

  // Map vars
  private map: any;
  private circle: any;
  private center: [number, number] = [22.9734, 78.6569]; // default India center
  private radiusMeters = 15000;

  // Pricing modal
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

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!isNaN(id)) {
      this.isLoading = true;
      this.apiService.getListingDetails(id).subscribe({
        next: (response) => {
          const apiData = response.data;
          this.item = {
            id: apiData.id,
            title: apiData.title,
            category: apiData.category,
            type: apiData.type,
            location: apiData.location,
            price: apiData.price,
            unit: apiData.unit,
            cover: apiData.cover || '',
            date: apiData.date,
            views: apiData.views,
            rating: apiData.rating,
            verified: apiData.verified,
            verifiedType: apiData.verifiedType,
          };

          // Set provider contact details
          this.provider.name = apiData.companyName || apiData.providerName || 'Provider';
          this.provider.email = apiData.contactEmail || apiData.providerEmail || '';
          this.provider.phone = apiData.contactPhone || apiData.providerPhone || '';
          if (apiData.providerMemberSince) {
            this.provider.memberSince = apiData.providerMemberSince;
          }

          // Set thumbnails from images or cover
          if (apiData.images && apiData.images.length > 0) {
            this.thumbnails = apiData.images;
          } else if (this.item.cover) {
            this.thumbnails = [this.item.cover];
          }

          this.updateCanonical();
          this.loadRelatedListings();
          this.setupIncludes();
          this.setupOverview();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = this.apiService.extractError(err).message;
          this.isLoading = false;
        },
      });
    }
  }

  private loadRelatedListings() {
    if (!this.item) return;
    const all = this.svc.getAll();
    this.related = all
      .filter((i) => i.category === this.item!.category && i.id !== this.item!.id)
      .slice(0, 6);
  }

  private setupIncludes() {
    if (!this.item) return;
    const map: Record<string, string[]> = {
      Plumbing: [
        'Inspection and Diagnosis',
        'Circuit Breaker Replacement',
        'Panel Replacement or Upgrade',
        'Fuse Box to Circuit Breaker Conversion',
      ],
      Electrical: ['Wiring Check', 'Appliance Installation', 'Lighting Setup', 'Panel Repair'],
      Cleaning: ['Home Deep Clean', 'Kitchen Degreasing', 'Bathroom Descale', 'Sofa Shampoo'],
      Tutoring: ['Course Material', 'Weekly Assessment', 'Doubt Clearing', 'Progress Reports'],
      Carpentry: ['Furniture Repair', 'Custom Shelves', 'Door Alignment', 'Hardware Replacement'],
      Painting: ['Interior Painting', 'Exterior Painting', 'Primer and Putty', 'Touch‑ups'],
      Moving: ['Packing', 'Loading & Unloading', 'Transport', 'Placement'],
      'Appliance Repair': [
        'Diagnosis',
        'Spare Parts Replacement',
        'Performance Test',
        'Warranty Support',
      ],
    };
    this.includes = map[this.item.category] || ['Consultation', 'Standard Service'];
  }

  private setupOverview() {
    if (!this.item) return;
    this.overview = `${this.item.title} available in ${this.item.location}. Professional ${this.item.category.toLowerCase()} service performed by verified providers with transparent pricing. Reach out to schedule and get an exact quote for your requirement.`;
  }

  private coordsForLocation(loc: string | undefined): [number, number] {
    if (!loc) return this.center;
    const city = loc.split(',')[0].trim();
    const table: Record<string, [number, number]> = {
      Delhi: [28.6139, 77.209],
      Mumbai: [19.076, 72.8777],
      Bengaluru: [12.9716, 77.5946],
      Hyderabad: [17.385, 78.4867],
      Chennai: [13.0827, 80.2707],
      Kolkata: [22.5726, 88.3639],
      Pune: [18.5204, 73.8567],
      Ahmedabad: [23.0225, 72.5714],
      Jaipur: [26.9124, 75.7873],
      Surat: [21.1702, 72.8311],
    };
    return table[city] || this.center;
  }

  private getOrigin(): string {
    return (globalThis as any).location?.origin || '';
  }

  private slugify(input: string): string {
    return (input || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private cityFromLocation(loc?: string): string {
    return (loc || '').split(',')[0].trim();
  }

  private hasTrackingParams(): boolean {
    const qs = (globalThis as any).location?.search || '';
    const sp = new URLSearchParams(qs);
    const keys = Array.from(sp.keys());
    const hasUtm = keys.some((k) => /^utm_/i.test(k));
    const tracking = [
      'gclid',
      'fbclid',
      'msclkid',
      'dclid',
      'icid',
      'ref',
      'referrer',
      'session',
      'sid',
    ];
    return hasUtm || keys.some((k) => tracking.includes(k.toLowerCase()));
  }

  private updateCanonical() {
    if (!this.item) return;
    const origin = this.getOrigin();
    const citySlug = this.slugify(this.cityFromLocation(this.item.location));
    const nameSlug = this.slugify(this.item.title);
    const base = `${origin}/listing/${citySlug}/${nameSlug}-${this.item.id}`;

    let canonical = base;
    if (this.hasTrackingParams()) {
      canonical = base;
    }

    let link: HTMLLinkElement | null = this.doc.querySelector("link[rel='canonical']");
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', canonical);

    const current = (globalThis as any).location?.pathname || '';
    if (current && current !== `/listing/${citySlug}/${nameSlug}-${this.item.id}`) {
      this.meta.updateTag({ rel: 'canonical', href: canonical } as any);
    }
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.item) return;
    this.center = this.coordsForLocation(this.item.location);

    const el = document.getElementById('serviceAreaMap');
    if (!el) return;

    this.map = L.map(el).setView(this.center, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.circle = L.circle(this.center, {
      radius: this.radiusMeters,
      color: '#7b61ff',
      weight: 2,
      fillColor: '#7b61ff',
      fillOpacity: 0.12,
    }).addTo(this.map);
  }

  ngOnDestroy() {
    if (this.map && this.map.remove) this.map.remove();
  }
}

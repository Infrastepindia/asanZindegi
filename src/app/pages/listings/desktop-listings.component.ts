import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdsService } from '../../services/ads.service';
import { ApiService, ApiSuperCategory } from '../../services/api.service';
import { PhotonService } from '../../services/photon.service';
import { CityService } from '../../shared/city.service';
import { OsmAutocompleteComponent } from '../../shared/osm-autocomplete.component';
import { Meta } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { PLACEHOLDER_IMAGE } from '../../constants';

interface ListingItem {
  id: number;
  title: string;
  category: string;
  type: 'Sell' | 'Rent' | 'Exchange' | 'Service';
  location: string;
  price: number;
  unit?: string;
  cover: string;
  date: string;
  views: number;
  rating: number;
  verified: boolean;
  verifiedType?: 'Company' | 'KYC';
  serviceType?: string;
}

@Component({
  selector: 'app-desktop-listings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, OsmAutocompleteComponent],
  templateUrl: './desktop-listings.component.html',
  styleUrl: './desktop-listings.component.css',
})
export class DesktopListingsComponent implements OnInit {
  private ads = inject(AdsService);
  private api = inject(ApiService);
  private photon = inject(PhotonService);
  private cityService = inject(CityService);
  private failedImages = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
  ) {}

  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  showCityPicker = false;
  private cityPrefKey = 'az_city_pref';
  cityOptions: Array<{ name: string; img: string }> = [
    {
      name: 'Kolkata, India',
      img: 'https://images.unsplash.com/photo-1569416167996-433986d98891?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Mumbai, India',
      img: 'https://images.unsplash.com/photo-1562307532-46792c3a5b22?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Hyderabad, India',
      img: 'https://images.unsplash.com/photo-1609840178322-771ae9c3a3b3?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Delhi, India',
      img: 'https://images.unsplash.com/photo-1606062159139-9a5b5f9d5442?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Chennai, India',
      img: 'https://images.unsplash.com/photo-1608628047959-3212cbb3f2df?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Bengaluru, India',
      img: 'https://images.unsplash.com/photo-1604328698692-f76ea9498f8e?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Durgapur, India',
      img: 'https://images.unsplash.com/photo-1590051034278-5e7c3d5a7933?q=80&w=600&auto=format&fit=crop',
    },
  ];

  ngOnInit(): void {
    const cat = this.route.snapshot.queryParamMap.get('category') || '';
    const loc = this.route.snapshot.queryParamMap.get('location') || '';
    const saved =
      typeof window !== 'undefined' ? window.localStorage.getItem(this.cityPrefKey) : null;
    if (cat) this.filters.selectedCategories = [cat];
    if (loc) this.filters.location = loc;
    else if (saved) this.filters.location = saved;
    else this.showCityPicker = true;
    if (cat || loc || saved) this.setPage(1);

    this.loadListings();

    this.api.getCategories().subscribe({
      next: (res) => {
        this.superCategories.set(res?.data || []);
      },
      error: () => {
        this.superCategories.set([]);
      },
    });

    this.route.queryParamMap.subscribe((map) => {
      const c = map.get('category') || '';
      const l = map.get('location') || '';
      this.filters.selectedCategories = c ? [c] : [];
      if (l) this.filters.location = l;
      this.loadListings();
      this.setPage(1);
    });
  }

  private loadListings(): void {
    this.isLoadingListings = true;
    const superCategory = this.route.snapshot.queryParamMap.get('super') || undefined;
    const category = this.route.snapshot.queryParamMap.get('category') || undefined;
    const location = this.route.snapshot.queryParamMap.get('location') || undefined;

    this.api
      .getListings(this.apiPage, this.apiPerPage, {
        superCategory,
        category,
        location,
      })
      .subscribe({
        next: (res) => {
          if (res?.data?.items) {
            const apiListings = res.data.items.map(
              (item) =>
                ({
                  id: item.id,
                  title: item.title,
                  category: item.category || 'Service',
                  type: (item.type as ListingItem['type']) || 'Service',
                  location: item.location,
                  price: typeof item.price === 'string' ? parseInt(item.price, 10) : item.price,
                  unit: item.unit || '',
                  cover: environment.file_path + item.cover || '',
                  date: item.date,
                  views: item.views,
                  rating: item.rating,
                  verified: item.verified,
                  verifiedType:
                    item.verifiedType === 'Company'
                      ? 'Company'
                      : item.verifiedType === 'Individual'
                        ? 'KYC'
                        : undefined,
                  serviceType: (item.title || '').split(' - ')[0].trim() || item.title,
                }) as ListingItem,
            );

            this.all = [...apiListings];
            this.apiTotal = res.data.total;
          }
          this.cd.detectChanges();
          this.isLoadingListings = false;
        },
        error: () => {
          this.all = [];
          this.isLoadingListings = false;
        },
      });
  }

  locationResults: Array<{ display_name: string; lat: string; lon: string }> = [];
  locationLoading = false;
  private locDebounce?: any;

  filters = {
    selectedCategories: [] as string[],
    location: '',
    minRating: 0 as number,
    verified: 'all' as 'all' | 'verified' | 'unverified',
    provider: 'all' as 'all' | 'company' | 'individual',
    category: '' as string,
    type: '' as '' | ListingItem['type'],
  };

  superCategories = signal<ApiSuperCategory[]>([]);
  expandedSuperIds = new Set<number>();

  toggleSuper(id: number) {
    if (this.expandedSuperIds.has(id)) this.expandedSuperIds.delete(id);
    else this.expandedSuperIds.add(id);
  }

  isSubSelected(name: string): boolean {
    return this.filters.selectedCategories.includes(name);
  }

  toggleSubCategory(name: string) {
    const idx = this.filters.selectedCategories.indexOf(name);
    if (idx >= 0) {
      this.filters.selectedCategories = this.filters.selectedCategories.filter(
        (_, i) => i !== idx,
      );
    } else {
      this.filters.selectedCategories = [...this.filters.selectedCategories, name];
    }
    this.setPage(1);
    this.cd.detectChanges();
  }

  clearSelectedCategories() {
    this.filters.selectedCategories = [];
    this.setPage(1);
    this.cd.detectChanges();
  }

  private serviceTypeMap: Record<string, string[]> = {};

  get serviceTypesForSelected(): string[] {
    const cat = this.filters.category;
    return cat && (this.serviceTypeMap as any)[cat] ? this.serviceTypeMap[cat] : [];
  }

  private prng(seed: number) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private coverByCategory: Record<string, string[]> = {};

  private cities = [
    'Delhi, India',
    'Mumbai, India',
    'Bengaluru, India',
    'Hyderabad, India',
    'Chennai, India',
    'Kolkata, India',
    'Pune, India',
    'Ahmedabad, India',
    'Jaipur, India',
    'Surat, India',
  ];

  types: Array<ListingItem['type']> = ['Sell', 'Rent', 'Exchange', 'Service'];

  all: ListingItem[] = [];
  apiTotal = 0;
  apiPage = 1;
  apiPerPage = 10;
  isLoadingListings = false;

  page = 1;
  perPage = 5;

  get filtered(): ListingItem[] {
    let out = this.all.slice();
    if (this.filters.selectedCategories.length)
      out = out.filter((i) => this.filters.selectedCategories.includes(i.category));

    const minR = Number(this.filters.minRating) || 0;
    if (minR > 0) out = out.filter((i) => i.rating >= minR);

    if (this.filters.verified === 'verified') out = out.filter((i) => i.verified);
    if (this.filters.verified === 'unverified') out = out.filter((i) => !i.verified);

    if (this.filters.provider === 'company') out = out.filter((i) => i.verifiedType === 'Company');
    if (this.filters.provider === 'individual')
      out = out.filter((i) => i.verifiedType !== 'Company');

    return out;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.perPage));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get visiblePages(): Array<number | '...'> {
    const total = this.totalPages;
    const current = this.page;
    const windowSize = 2;
    if (total <= 7) return this.pages as any;

    const set = new Set<number>();
    set.add(1);
    set.add(total);
    for (let i = current - windowSize; i <= current + windowSize; i++) {
      if (i > 1 && i < total) set.add(i);
    }
    const arr = Array.from(set).sort((a, b) => a - b);
    const out: Array<number | '...'> = [];
    let prev: number | null = null;
    for (const n of arr) {
      if (prev !== null && n - prev > 1) out.push('...');
      out.push(n);
      prev = n;
    }
    return out;
  }

  get showingStart(): number {
    return this.filtered.length ? (this.page - 1) * this.perPage + 1 : 0;
  }

  get showingEnd(): number {
    return Math.min(this.page * this.perPage, this.filtered.length);
  }

  get paged(): ListingItem[] {
    const start = (this.page - 1) * this.perPage;
    return this.filtered.slice(start, start + this.perPage);
  }

  availabilityLabel(it: ListingItem): 'Currently Available' | 'Available for Call' {
    return it.id % 2 === 0 ? 'Currently Available' : 'Available for Call';
  }

  private cityCoords: Record<string, { lat: number; lon: number }> = {
    'Delhi, India': { lat: 28.6139, lon: 77.209 },
    'Mumbai, India': { lat: 19.076, lon: 72.8777 },
    'Bengaluru, India': { lat: 12.9716, lon: 77.5946 },
    'Hyderabad, India': { lat: 17.385, lon: 78.4867 },
    'Chennai, India': { lat: 13.0827, lon: 80.2707 },
    'Kolkata, India': { lat: 22.5726, lon: 88.3639 },
    'Pune, India': { lat: 18.5204, lon: 73.8567 },
    'Ahmedabad, India': { lat: 23.0225, lon: 72.5714 },
    'Jaipur, India': { lat: 26.9124, lon: 75.7873 },
    'Surat, India': { lat: 21.1702, lon: 72.8311 },
    'Durgapur, India': { lat: 23.5204, lon: 87.3119 },
  };

  private findSearchCity(): { name: string; lat: number; lon: number } | null {
    const q = (this.filters.location || '').toLowerCase().trim();
    if (!q) return null;
    for (const name of Object.keys(this.cityCoords)) {
      if (name.toLowerCase().includes(q)) {
        const c = this.cityCoords[name];
        return { name, lat: c.lat, lon: c.lon };
      }
    }
    return null;
  }

  private haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const la1 = (a.lat * Math.PI) / 180;
    const la2 = (b.lat * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h = sinDLat * sinDLat + Math.cos(la1) * Math.cos(la2) * sinDLon * sinDLon;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  distanceFromSearch(itemLocation: string): string | null {
    const search = this.findSearchCity();
    if (!search) return null;
    const cityName = Object.keys(this.cityCoords).find((k) => k === itemLocation);
    if (!cityName) return null;
    const km = this.haversineKm(search, this.cityCoords[cityName]);
    return `${Math.round(km)} km`;
  }

  distanceBadge(itemLocation: string): string {
    return this.distanceFromSearch(itemLocation) || 'Set location';
  }

  getImageSource(item: ListingItem): string {
    if (this.failedImages.has(item.id.toString())) {
      return PLACEHOLDER_IMAGE;
    }
    return item.cover && item.cover.trim() ? item.cover : PLACEHOLDER_IMAGE;
  }

  onImageLoadError(item: ListingItem): void {
    this.failedImages.add(item.id.toString());
  }

  onPlaceSelected(val: string) {
    this.filters.location = val || '';
    if (typeof window !== 'undefined')
      window.localStorage.setItem(this.cityPrefKey, this.filters.location);
    this.setPage(1);
    this.cd.detectChanges();
  }

  chooseCity(name: string) {
    this.filters.location = name;
    if (typeof window !== 'undefined') window.localStorage.setItem(this.cityPrefKey, name);
    this.showCityPicker = false;
    this.setPage(1);
  }

  setPage(p: number) {
    const pages = this.totalPages;
    this.page = Math.max(1, Math.min(p, pages));
    this.updateSEO();
  }

  onLocationChange(value: string) {
    this.filters.location = value;
    if (this.locDebounce) clearTimeout(this.locDebounce);
    if (!value || value.trim().length < 2) {
      this.locationResults = [];
      return;
    }
    this.locDebounce = setTimeout(() => this.queryPhoton(value.trim()), 300);
  }

  selectLocation(item: { display_name: string; lat: string; lon: string }) {
    this.filters.location = item.display_name;
    this.locationResults = [];
    this.setPage(1);
  }

  private queryPhoton(q: string) {
    this.locationLoading = true;

    const currentCity = this.cityService.city();
    const bounds = currentCity ? this.cityService.getBoundsForCity(currentCity) : null;

    let lat: number | undefined;
    let lon: number | undefined;

    if (bounds) {
      lat = (bounds.bottom + bounds.top) / 2;
      lon = (bounds.left + bounds.right) / 2;
    }

    this.photon.searchLocation(q, 'IN', 8, lat, lon).subscribe({
      next: (results) => {
        this.locationResults = results;
        this.locationLoading = false;
      },
      error: () => {
        this.locationResults = [];
        this.locationLoading = false;
      },
    });
  }

  private getOrigin(): string {
    return (globalThis as any).location?.origin || '';
  }

  private slugify(input: string): string {
    return input
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private hasTrackingParams(map: import('@angular/router').ParamMap): boolean {
    const keys = (map as any).keys as string[];
    const hasUtm = keys.some((k) => /^utm_/i.test(k));
    const trackingKeys = [
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
    const hasOther = keys.some((k) => trackingKeys.includes(k.toLowerCase()));
    return hasUtm || hasOther;
  }

  private hasFilterParams(map: import('@angular/router').ParamMap): boolean {
    const f = [
      'category',
      'type',
      'location',
      'minPrice',
      'maxPrice',
      'minRating',
      'verified',
      'city',
    ];
    const keys = (map as any).keys as string[];
    return keys.some((k) => f.includes(k));
  }

  private isSEOValuableFilters(map: import('@angular/router').ParamMap): boolean {
    const keys = (map as any).keys as string[];
    const disallowed = ['minPrice', 'maxPrice', 'minRating', 'verified'];
    if (keys.some((k) => disallowed.includes(k))) return false;
    const allowed = ['category', 'type', 'city'];
    return keys.some((k) => allowed.includes(k));
  }

  private extractCityName(map: import('@angular/router').ParamMap): string | null {
    const city = map.get('city');
    if (city) return city;
    if (this.filters.location) return this.filters.location.split(',')[0].trim();
    return null;
  }

  private buildFilterQuery(map: import('@angular/router').ParamMap, hasCity: boolean): string {
    const category = (map.get('category') || this.filters.category || '').trim();
    const type = (map.get('type') || this.filters.type || '').trim();
    const parts: string[] = [];
    if (category) parts.push(this.slugify(category));
    if (type) parts.push(this.slugify(type));
    if (!parts.length) return '';
    return hasCity ? `-${parts.join('-')}` : `/${parts.join('-')}`;
  }

  private updateSEO(): void {
    const map = this.route.snapshot.queryParamMap;
    const origin = this.getOrigin();
    const cityName = this.extractCityName(map);
    const basePath = cityName ? `/listings/${this.slugify(cityName)}` : '/listings';

    let canonical = origin + basePath;

    const hasTracking = this.hasTrackingParams(map);
    const hasFilters = this.hasFilterParams(map);

    if (hasFilters && this.isSEOValuableFilters(map)) {
      const hasCity = /\/listings\/.+/.test(basePath);
      canonical = origin + basePath + this.buildFilterQuery(map, hasCity);
    } else if (hasFilters && !this.isSEOValuableFilters(map)) {
      this.meta.updateTag({ name: 'robots', content: 'noindex,follow' });
      canonical = origin + basePath;
    } else {
      this.meta.removeTag("name='robots'");
    }

    if (this.page > 1) {
      const sep = canonical.includes('?') ? '&' : '?';
      canonical = `${canonical}${sep}page=${this.page}`;
    }

    if (hasTracking) {
      canonical = origin + basePath + (this.page > 1 ? `?page=${this.page}` : '');
    }

    let link: HTMLLinkElement | null = this.doc.querySelector("link[rel='canonical']");
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', canonical);
  }
}

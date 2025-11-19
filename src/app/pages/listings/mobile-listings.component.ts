import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdsService } from '../../services/ads.service';
import { ApiService, ApiSuperCategory } from '../../services/api.service';
import { PhotonService } from '../../services/photon.service';
import { CityService } from '../../shared/city.service';
import { OsmAutocompleteComponent } from '../../shared/osm-autocomplete.component';
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
  selector: 'app-mobile-listings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, OsmAutocompleteComponent],
  templateUrl: './mobile-listings.component.html',
  styleUrl: './mobile-listings.component.css',
})
export class MobileListingsComponent implements OnInit {
  private ads = inject(AdsService);
  private api = inject(ApiService);
  private photon = inject(PhotonService);
  private cityService = inject(CityService);
  private failedImages = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
  ) {}

  showCityPicker = false;
  showFilterSheet = false;
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
    if (idx >= 0) this.filters.selectedCategories.splice(idx, 1);
    else this.filters.selectedCategories.push(name);
    this.setPage(1);
  }

  clearSelectedCategories() {
    this.filters.selectedCategories = [];
    this.setPage(1);
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

  all: ListingItem[] = [];
  apiTotal = 0;
  apiPage = 1;
  apiPerPage = 10;
  isLoadingListings = false;

  page = 1;
  perPage = 8;

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

  get paged(): ListingItem[] {
    const start = (this.page - 1) * this.perPage;
    return this.filtered.slice(start, start + this.perPage);
  }

  get showingCount(): number {
    return this.filtered.length;
  }

  availabilityLabel(it: ListingItem): 'Currently Available' | 'Available for Call' {
    return it.id % 2 === 0 ? 'Currently Available' : 'Available for Call';
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

  openFilterSheet() {
    this.showFilterSheet = true;
  }

  closeFilterSheet() {
    this.showFilterSheet = false;
  }

  applyFilters() {
    this.setPage(1);
    this.closeFilterSheet();
  }

  nextPage() {
    if (this.page < this.totalPages) this.setPage(this.page + 1);
  }

  prevPage() {
    if (this.page > 1) this.setPage(this.page - 1);
  }
}

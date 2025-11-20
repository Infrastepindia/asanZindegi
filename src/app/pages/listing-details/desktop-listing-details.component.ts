import {
  Component,
  inject,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ListingsService, ListingItem } from '../../services/listings.service';
import { AdsService } from '../../services/ads.service';
import { ApiService } from '../../services/api.service';
import { Meta } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { PLACEHOLDER_IMAGE } from '../../constants';

declare const L: any;

@Component({
  selector: 'app-desktop-listing-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './desktop-listing-details.component.html',
  styleUrl: './desktop-listing-details.component.css',
})
export class DesktopListingDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private svc = inject(ListingsService);
  private ads = inject(AdsService);
  private apiService = inject(ApiService);
  private platformId = inject(PLATFORM_ID);
  private doc = inject(DOCUMENT);
  private meta = inject(Meta);
  private destroy$ = new Subject<void>();

  @ViewChild('mapContainer') mapContainer?: ElementRef;

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

  get serviceTypes(): string[] {
    const cat = this.item?.category || '';
    return cat ? this.svc.getServiceTypesByCategoryName(cat).map((t) => t.name) : [];
  }

  private map: any;
  private polygon: any;
  private centerPoint: [number, number] = [22.9734, 78.6569];
  mapLoaded = false;

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
      console.log('Listing ID (desktop):', this.listingId);
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
          areaCoveredPolygon: apiData.areaCoveredPolygon,
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

        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initializeMap(), 100);
        }

        this.isLoading = false;
      }
    });
  }

  private initializeMap(): void {
    if (!this.mapContainer) return;

    try {
      if (this.map) {
        this.map.remove();
      }

      this.map = L.map(this.mapContainer.nativeElement).setView(this.centerPoint, 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(this.map);

      if (this.item?.areaCoveredPolygon) {
        this.renderPolygon();
      }

      this.mapLoaded = true;
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }

  private renderPolygon(): void {
    if (!this.item?.areaCoveredPolygon || !this.map) return;

    try {
      let coordinates: [number, number][] = [];

      // Check if it's a semicolon-separated string of coordinates
      if (typeof this.item.areaCoveredPolygon === 'string' && this.item.areaCoveredPolygon.includes(';')) {
        // Parse "lat,lng;lat,lng;..." format
        const coordinateStrings = this.item.areaCoveredPolygon.split(';');
        coordinates = coordinateStrings
          .map((coord: string) => {
            const [lat, lng] = coord.split(',').map((v: string) => parseFloat(v.trim()));
            return isFinite(lat) && isFinite(lng) ? [lat, lng] : null;
          })
          .filter((coord: any) => coord !== null) as [number, number][];
      } else {
        // Try parsing as GeoJSON
        const geoJson = JSON.parse(this.item.areaCoveredPolygon);

        if (geoJson.type === 'Polygon' && geoJson.coordinates && geoJson.coordinates.length > 0) {
          coordinates = geoJson.coordinates[0].map((coord: [number, number]) => [coord[0], coord[1]]);
        }
      }

      if (coordinates.length > 0) {
        if (this.polygon) {
          this.map.removeLayer(this.polygon);
        }

        this.polygon = L.polygon(coordinates, {
          color: '#4CAF50',
          weight: 2,
          opacity: 0.7,
          fillColor: '#4CAF50',
          fillOpacity: 0.2,
        }).addTo(this.map);

        this.map.fitBounds(this.polygon.getBounds());
      }
    } catch (error) {
      console.error('Polygon rendering error:', error);
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

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}

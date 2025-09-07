import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ListingsService, ListingItem } from '../../services/listings.service';

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
  private platformId = inject(PLATFORM_ID);

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

  // Contact visibility flags
  showPhone = false;
  showEmail = false;

  // Service types per category
  private serviceTypeMap: Record<string, string[]> = {
    Plumbing: ['Leak Fix', 'Pipe Installation', 'Bathroom Fittings'],
    Electrical: ['Wiring', 'Appliance Install', 'Lighting'],
    Cleaning: ['Home Cleaning', 'Deep Cleaning', 'Office Cleaning'],
    Tutoring: ['Math', 'English', 'Science'],
    Carpentry: ['Furniture Repair', 'Custom Shelves'],
    Painting: ['Interior', 'Exterior'],
    Moving: ['House Shifting', 'Office Relocation'],
    'Appliance Repair': ['AC Repair', 'Fridge Repair', 'Washing Machine Repair'],
  };
  get serviceTypes(): string[] {
    const cat = this.item?.category || '';
    return cat && this.serviceTypeMap[cat] ? this.serviceTypeMap[cat] : [];
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
      this.item = this.svc.getById(id);
    }
    if (this.item) {
      const all = this.svc.getAll();
      this.related = all
        .filter((i) => i.category === this.item!.category && i.id !== this.item!.id)
        .slice(0, 6);
      this.thumbnails = [this.item.cover, ...this.related.map((r) => r.cover)].slice(0, 6);
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
      this.overview = `${this.item.title} available in ${this.item.location}. Professional ${this.item.category.toLowerCase()} service performed by verified providers with transparent pricing. Reach out to schedule and get an exact quote for your requirement.`;
    }
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

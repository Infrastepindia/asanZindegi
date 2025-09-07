import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdsService } from '../../services/ads.service';

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
}

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './listings.component.html',
  styleUrl: './listings.component.css',
})
export class ListingsComponent implements OnInit {
  private ads = inject(AdsService);
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const cat = this.route.snapshot.queryParamMap.get('category') || '';
    const typ = this.route.snapshot.queryParamMap.get('type') || '';
    const loc = this.route.snapshot.queryParamMap.get('location') || '';
    if (cat) this.filters.category = cat;
    if (typ) this.filters.type = typ as any;
    if (loc) this.filters.location = loc;
    if (cat || typ || loc) this.setPage(1);
    this.route.queryParamMap.subscribe((map) => {
      const c = map.get('category') || '';
      const t = map.get('type') || '';
      const l = map.get('location') || '';
      this.filters.category = c;
      this.filters.type = (t as any) || '';
      this.filters.location = l;
      this.setPage(1);
    });
  }
  filters = {
    category: '',
    type: '',
    location: '',
    minPrice: '',
    maxPrice: '',
    minRating: 0 as number,
    verified: 'all' as 'all' | 'verified' | 'unverified',
  };

  categories = [
    'Plumbing',
    'Electrical',
    'Cleaning',
    'Tutoring',
    'Carpentry',
    'Painting',
    'Moving',
    'Appliance Repair',
  ];

  types: Array<ListingItem['type']> = ['Sell', 'Rent', 'Exchange', 'Service'];

  private prng(seed: number) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private coverByCategory: Record<string, string[]> = {
    Plumbing: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621905251180-97f6f10c8d1b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1605652866327-96ae58c6ba86?q=80&w=1200&auto=format&fit=crop',
    ],
    Electrical: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89f11d?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop',
    ],
    Cleaning: [
      'https://images.unsplash.com/photo-1581578733145-b93f9678f53b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581578017426-cf34aaf1ffd1?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584622781365-6761f7d64240?q=80&w=1200&auto=format&fit=crop',
    ],
    Tutoring: [
      'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=1200&auto=format&fit=crop',
    ],
    Carpentry: [
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519710164239-8d0a3d6a0eef?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1616628182501-3b3f34f184d5?q=80&w=1200&auto=format&fit=crop',
    ],
    Painting: [
      'https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585842378054-6bb0fd52ff7b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=1200&auto=format&fit+crop',
    ],
    Moving: [
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585432959449-b1c11f3cba9a?q=80&w=1200&auto=format&fit=crop',
    ],
    'Appliance Repair': [
      'https://images.unsplash.com/photo-1581093588401-16c9e6d0147b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603715749720-3bd0e8020f82?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555617117-08fda9c09b69?q=80&w=1200&auto=format&fit=crop',
    ],
  };

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

  private createTitle(category: string, type: ListingItem['type'], index: number) {
    const base = {
      Plumbing: ['Leak Fix', 'Pipe Installation', 'Bathroom Fittings', 'Kitchen Plumbing'],
      Electrical: ['Wiring Service', 'Appliance Install', 'Lighting Setup', 'Panel Repair'],
      Cleaning: ['Home Cleaning', 'Deep Cleaning', 'Office Cleaning', 'Sofa Shampoo'],
      Tutoring: ['Math Tuition', 'English Coaching', 'Science Tutor', 'Exam Prep'],
      Carpentry: ['Furniture Repair', 'Custom Shelves', 'Door Fix', 'Wardrobe Build'],
      Painting: ['Interior Paint', 'Exterior Paint', 'Texture Work', 'Ceiling Paint'],
      Moving: ['House Shifting', 'Office Relocation', 'Packing Service', 'Local Transport'],
      'Appliance Repair': ['AC Repair', 'Fridge Repair', 'Washer Repair', 'Microwave Fix'],
    } as Record<string, string[]>;
    const arr = base[category] || ['Service'];
    const name = arr[index % arr.length];
    return `${name} - ${category}` + (type !== 'Service' ? ` (${type})` : '');
  }

  private priceFor(category: string, type: ListingItem['type'], rnd: () => number) {
    const base = {
      Plumbing: [299, 1499],
      Electrical: [249, 1799],
      Cleaning: [399, 2499],
      Tutoring: [199, 999],
      Carpentry: [349, 1999],
      Painting: [499, 3999],
      Moving: [999, 9999],
      'Appliance Repair': [299, 2499],
    } as Record<string, [number, number]>;
    const [min, max] = base[category] || [199, 1999];
    let price = Math.round(min + rnd() * (max - min));
    if (type === 'Rent') price = Math.round(price * 0.8);
    if (type === 'Exchange') price = Math.round(price * 0.6);
    return price;
  }

  private unitFor(type: ListingItem['type']): string | undefined {
    if (type === 'Rent') return 'per day';
    if (type === 'Service') return 'per visit';
    return undefined;
  }

  private generateListings(): ListingItem[] {
    const rnd = this.prng(42);
    const out: ListingItem[] = [];
    let id = 1;
    const now = Date.now();
    for (const cat of this.categories) {
      for (const typ of this.types) {
        for (let i = 0; i < 20; i++) {
          const covers = this.coverByCategory[cat] || [];
          const cover = covers.length
            ? covers[i % covers.length]
            : 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop';
          const daysAgo = Math.floor(rnd() * 120);
          const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
          const location = this.cities[Math.floor(rnd() * this.cities.length)];
          const price = this.priceFor(cat, typ, rnd);
          const views = Math.floor(50 + rnd() * 2000);
          const rating = 3 + Math.floor(rnd() * 3);
          const verified = rnd() < 0.6;
          const verifiedType = verified ? (rnd() < 0.5 ? 'Company' : 'KYC') : undefined;
          out.push({
            id: id++,
            title: this.createTitle(cat, typ, i),
            category: cat,
            type: typ,
            location,
            price,
            unit: this.unitFor(typ),
            cover,
            date,
            views,
            rating,
            verified,
            verifiedType,
          });
        }
      }
    }
    return out;
  }

  private posted(): ListingItem[] {
    return this.ads.getAll().map((ad) => ({
      id: ad.id,
      title: ad.title,
      category: ad.category,
      type: ad.type,
      location: ad.location,
      price: ad.price,
      unit: ad.unit,
      cover: ad.cover,
      date: ad.date,
      views: ad.views,
      rating: ad.rating,
      verified: ad.verified,
      verifiedType: ad.verifiedType,
    }));
  }

  all: ListingItem[] = [...this.posted(), ...this.generateListings()];

  page = 1;
  perPage = 5;

  get filtered(): ListingItem[] {
    let out = this.all.slice();
    if (this.filters.category) out = out.filter((i) => i.category === this.filters.category);
    if (this.filters.type) out = out.filter((i) => i.type === (this.filters.type as any));
    if (this.filters.location)
      out = out.filter((i) =>
        i.location.toLowerCase().includes(this.filters.location.toLowerCase()),
      );
    const min = this.filters.minPrice ? parseFloat(this.filters.minPrice) : null;
    const max = this.filters.maxPrice ? parseFloat(this.filters.maxPrice) : null;
    if (min !== null) out = out.filter((i) => i.price >= (min as number));
    if (max !== null) out = out.filter((i) => i.price <= (max as number));

    const minR = Number(this.filters.minRating) || 0;
    if (minR > 0) out = out.filter((i) => i.rating >= minR);

    if (this.filters.verified === 'verified') out = out.filter((i) => i.verified);
    if (this.filters.verified === 'unverified') out = out.filter((i) => !i.verified);

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

  setPage(p: number) {
    const pages = this.totalPages;
    this.page = Math.max(1, Math.min(p, pages));
  }
}

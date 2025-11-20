import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, ApiSuperCategory } from '../../services/api.service';
import { PhotonService, LocationResult } from '../../services/photon.service';
import { CityService } from '../../shared/city.service';

interface CategoryItem {
  name: string;
  icon: string; // bootstrap icon class
  count: number;
  iconUrl?: string; // optional custom icon image
}

interface FeaturedAd {
  title: string;
  type: 'B2C' | 'B2B';
  location: string;
  price: string;
  cover: string;
}

interface ProviderItem {
  name: string;
  role: string;
  avatar: string;
}

interface ReviewItem {
  author: string;
  service: string;
  rating: number; // 0..5
  text: string;
  avatar: string;
}

interface BlogItem {
  title: string;
  cover: string;
  date: string;
}

@Component({
  selector: 'app-desktop-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './desktop-landing.component.html',
  styleUrl: './desktop-landing.component.css',
})
export class DesktopLandingComponent implements OnInit {
  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (res) => {
        this.apiSuperCategories = (res && (res as any).data) || [];
        this.superCategoryOptions = this.apiSuperCategories.map((s) => ({
          key: s.id,
          title: s.title,
        }));
        this.visibleSuperCategories = this.apiSuperCategories.map((s) => ({
          key: s.id,
          title: s.title,
          colorClass: s.colorClass,
          icon: s.icon,
          items: s.categories.map((c) => ({ name: c.name, icon: c.icon, count: c.count })),
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.apiSuperCategories = [];
        this.superCategoryOptions = [];
        this.visibleSuperCategories = [];
        this.cdr.detectChanges();
      },
    });
  }

  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly photon = inject(PhotonService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly doc = inject(DOCUMENT);
  private readonly cityService = inject(CityService);

  readonly year = new Date().getFullYear();

  constructor() {
    this.updateCanonical();
  }

  private getOrigin(): string {
    return (globalThis as any).location?.origin || '';
  }

  private updateCanonical() {
    const origin = this.getOrigin();
    const href = origin ? `${origin}/` : '/';
    let link = this.doc.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = this.doc.createElement('link') as HTMLLinkElement;
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  slugify(input: string): string {
    return (input || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  search = {
    keyword: '',
    location: '',
    superCategory: '',
    category: '',
    serviceType: '',
    lat: null as number | null,
    lon: null as number | null,
  };

  popularKeywords: string[] = ['Plumber', 'Cleaner', 'Electrician'];

  // OpenStreetMap Nominatim autocomplete state
  locationResults: Array<{ display_name: string; lat: string; lon: string }> = [];
  locationLoading = false;
  private locDebounce?: any;

  private serviceTypeMap: Record<string, string[]> = {};

  superCategoryOptions: Array<{ key: number | string; title: string }> = [];
  categoryOptions: CategoryItem[] = [];
  private apiSuperCategories: ApiSuperCategory[] = [];

  private filteredBySuper(key: number | string): CategoryItem[] {
    if (!key) return [];
    const sc = this.apiSuperCategories.find((s) => String(s.id) === String(key));
    if (!sc) return [];
    return sc.categories.map((c) => ({ name: c.name, icon: c.icon, count: c.count }));
  }

  onSuperChange(value: number | string) {
    this.search.category = '';
    this.search.serviceType = '';
    this.categoryOptions = this.filteredBySuper(value);
  }

  get serviceTypesForSelected(): string[] {
    const cat = this.search.category;
    return cat && this.serviceTypeMap[cat] ? this.serviceTypeMap[cat] : [];
  }

  categories: CategoryItem[] = [];

  visibleSuperCategories: Array<{
    key: string | number;
    title: string;
    colorClass: string;
    icon: string;
    items: CategoryItem[];
  }> = [];

  featuredAds: FeaturedAd[] = [
    {
      title: 'Electric Panel Repairing Service',
      type: 'B2C',
      location: 'Delhi, India',
      price: '₹699 / visit',
      cover:
        'https://images.unsplash.com/photo-1581094794329-c8112a89f11d?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Computer & Server AMC Service',
      type: 'B2B',
      location: 'Bengaluru, India',
      price: '₹1,999 / month',
      cover:
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Tile and Wheel Repair Services',
      type: 'B2C',
      location: 'Pune, India',
      price: '₹399 / hour',
      cover:
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop',
    },
  ];

  recentAds: FeaturedAd[] = [
    {
      title: 'Electric Panel Repairing Service',
      type: 'B2C',
      location: 'Delhi, India',
      price: '₹699 / visit',
      cover:
        'https://images.unsplash.com/photo-1581094794329-c8112a89f11d?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Computer & Server AMC',
      type: 'B2B',
      location: 'Bengaluru, India',
      price: '₹1,999 / month',
      cover:
        'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Car Engine Services',
      type: 'B2C',
      location: 'Mumbai, India',
      price: '₹1,499 / package',
      cover:
        'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1200&auto=format&fit=crop',
    },
  ];

  providers: ProviderItem[] = [
    { name: 'Provider Demo', role: 'Electrician', avatar: 'https://i.pravatar.cc/100?img=12' },
    { name: 'Leslie Davis', role: 'Cleaner', avatar: 'https://i.pravatar.cc/100?img=32' },
    { name: 'Marcus Hassan', role: 'Mechanic', avatar: 'https://i.pravatar.cc/100?img=56' },
    { name: 'Daniel Morrison', role: 'Plumber', avatar: 'https://i.pravatar.cc/100?img=25' },
  ];

  reviews: ReviewItem[] = [
    {
      author: 'Daniel Davis',
      service: 'Quality of work was excellent',
      rating: 5,
      text: 'Great service and quick response. Highly recommended!',
      avatar: 'https://i.pravatar.cc/80?img=14',
    },
    {
      author: 'Daniel Davis',
      service: 'Green Cleaning',
      rating: 5,
      text: 'Professional and friendly. My home looks spotless.',
      avatar: 'https://i.pravatar.cc/80?img=45',
    },
    {
      author: 'Daniel Davis',
      service: 'Luxury Car Cleaning',
      rating: 4,
      text: 'Attention to detail and on time. Would hire again.',
      avatar: 'https://i.pravatar.cc/80?img=5',
    },
  ];

  blogs: BlogItem[] = [
    {
      title: '20+ Home & office maintenance tips',
      cover:
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop',
      date: 'Aug 12, 2025',
    },
    {
      title: 'Keep your AC efficient this summer',
      cover:
        'https://images.unsplash.com/photo-1603715749720-3bd0e8020f82?q=80&w=1200&auto=format&fit=crop',
      date: 'Aug 10, 2025',
    },
    {
      title: 'Smart ways to save on energy',
      cover:
        'https://images.unsplash.com/photo-1567427013953-1c0b0f3f3d5a?q=80&w=1200&auto=format&fit=crop',
      date: 'Aug 02, 2025',
    },
    {
      title: 'How to choose a reliable provider',
      cover:
        'https://images.unsplash.com/photo-1528291151373-5c93c1fdfc8f?q=80&w=1200&auto=format&fit=crop',
      date: 'Jul 25, 2025',
    },
  ];

  onSearch(e: Event) {
    e.preventDefault();
    const parts: string[] = [];
    if (this.search.location) {
      const city = this.search.location.split(',')[0].trim();
      if (city) parts.push(this.slugify(city));
    }
    if (this.search.category) parts.push(this.slugify(this.search.category));
    const slug = parts.join('-');

    const params: any = {};
    if (this.search.superCategory) params.super = this.search.superCategory;
    if (this.search.category) params.category = this.search.category;
    if (this.search.location) params.location = this.search.location;

    if (slug) this.router.navigate(['/listings', slug], { queryParams: params });
    else this.router.navigate(['/listings'], { queryParams: params });
  }

  onLocationChange(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    this.search.location = value;
    this.search.lat = null;
    this.search.lon = null;
    if (this.locDebounce) clearTimeout(this.locDebounce);
    if (!value || value.trim().length < 2) {
      this.locationResults = [];
      return;
    }
    this.locDebounce = setTimeout(() => this.queryPhoton(value.trim()), 300);
  }

  private queryPhoton(q: string) {
    if (!q || !q.trim()) return;

    this.locationLoading = true;

    const currentCity = this.cityService.city();
    const bounds = currentCity ? this.cityService.getBoundsForCity(currentCity) : null;

    let lat: number | undefined;
    let lon: number | undefined;

    if (bounds) {
      lat = (bounds.bottom + bounds.top) / 2;
      lon = (bounds.left + bounds.right) / 2;
    }

    this.photon.searchLocation(q, 'IN', 10, lat, lon).subscribe({
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

  selectLocation(item: { display_name: string; lat: string; lon: string }) {
    this.search.location = item.display_name;
    this.search.lat = parseFloat(item.lat);
    this.search.lon = parseFloat(item.lon);
    this.locationResults = [];
  }

  iconClass(icon?: string): string[] {
    if (!icon) return [];
    if (icon.startsWith('fa-')) return ['fa-solid', icon];
    if (icon.startsWith('bi-')) return ['bi', icon];
    return [icon];
  }
}

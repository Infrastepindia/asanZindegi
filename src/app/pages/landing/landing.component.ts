import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly year = new Date().getFullYear();

  search = {
    keyword: '',
    location: '',
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

  get serviceTypesForSelected(): string[] {
    const cat = this.search.category;
    return cat && this.serviceTypeMap[cat] ? this.serviceTypeMap[cat] : [];
  }

  categories: CategoryItem[] = [
    { name: 'Plumbing', icon: 'bi-tools', count: 128 },
    { name: 'Electrical', icon: 'bi-lightning-charge', count: 94 },
    { name: 'Cleaning', icon: 'bi-bucket', count: 210 },
    { name: 'Tutoring', icon: 'bi-book', count: 76 },
    { name: 'Carpentry', icon: 'bi-hammer', count: 63 },
    { name: 'Painting', icon: 'bi-brush', count: 58 },
    { name: 'Moving', icon: 'bi-truck', count: 34 },
    { name: 'Appliance Repair', icon: 'bi-tools', count: 45 },
  ];

  // Super-category model and AI-derived grouping
  superCategories: Array<{
    key: 'house-hold' | 'office-needs' | 'transport' | 'csr' | 'financial' | 'it-services';
    title: string;
    colorClass: string;
    categoryNames: string[];
  }> = [
    {
      key: 'house-hold',
      title: 'House Hold',
      colorClass: 'supercat-household',
      categoryNames: ['Plumbing', 'Cleaning', 'Carpentry', 'Painting', 'Appliance Repair'],
    },
    {
      key: 'office-needs',
      title: 'Office Needs',
      colorClass: 'supercat-office',
      categoryNames: ['Electrical'],
    },
    {
      key: 'transport',
      title: 'Transport',
      colorClass: 'supercat-transport',
      categoryNames: ['Moving'],
    },
    {
      key: 'csr',
      title: 'CSR',
      colorClass: 'supercat-csr',
      categoryNames: ['Tutoring'],
    },
    {
      key: 'financial',
      title: 'Financial',
      colorClass: 'supercat-financial',
      categoryNames: [],
    },
    {
      key: 'it-services',
      title: 'IT Services',
      colorClass: 'supercat-it',
      categoryNames: [],
    },
  ];

  get visibleSuperCategories() {
    return this.superCategories
      .map((s) => ({
        ...s,
        items: this.categories.filter((c) => s.categoryNames.includes(c.name)),
      }))
      .filter((s) => s.items.length > 0);
  }

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
      price: '���1,999 / month',
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
    const params: any = {};
    if (this.search.category) params.category = this.search.category;
    if (this.search.location) params.location = this.search.location;
    this.router.navigate(['/listings'], { queryParams: params });
  }

  onLocationChange(value: string) {
    this.search.location = value;
    this.search.lat = null;
    this.search.lon = null;
    if (this.locDebounce) clearTimeout(this.locDebounce);
    if (!value || value.trim().length < 2) {
      this.locationResults = [];
      return;
    }
    this.locDebounce = setTimeout(() => this.queryNominatim(value.trim()), 300);
  }

  private queryNominatim(q: string) {
    this.locationLoading = true;
    const left = 68.176645,
      right = 97.395561,
      bottom = 6.554607,
      top = 35.674545; // India bbox
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=in&viewbox=${left},${top},${right},${bottom}&bounded=1&accept-language=en-IN&q=${encodeURIComponent(q)}`;
    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        const filtered = (res || []).filter(
          (r) => (r.address?.country_code || '').toLowerCase() === 'in',
        );
        this.locationResults = filtered.length ? filtered : res || [];
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
}

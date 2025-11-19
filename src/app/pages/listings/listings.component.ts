import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdsService } from '../../services/ads.service';
import { ApiService, ApiSuperCategory } from '../../services/api.service';
import { OsmAutocompleteComponent } from '../../shared/osm-autocomplete.component';
import { HttpClient } from '@angular/common/http';
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
  selector: 'app-listings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, OsmAutocompleteComponent],
  templateUrl: './listings.component.html',
  styleUrl: './listings.component.css',
})
export class ListingsComponent implements OnInit {
  private ads = inject(AdsService);
  private api = inject(ApiService);
  private failedImages = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
  ) {}

  private readonly http = inject(HttpClient);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  // First-time city chooser
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

    // Load listings from API
    this.loadListings();

    // Load super categories for treeview
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

            // Combine API listings with posted ads
            this.all = [...apiListings];
            this.apiTotal = res.data.total;
          }
          this.cd.detectChanges();
          this.isLoadingListings = false;
        },
        error: () => {
          // Fallback to posted ads only
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
    serviceType: '' as string,
  };

  // Super category → subcategory treeview data
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

  categories = [
    // Household
    'Plumbing',
    'Electrical Repair',
    'Carpentry',
    'Painting & Whitewashing',
    'Home Cleaning',
    'Appliance Repair',
    'Pest Control',
    'RO/Water Purifier Service',
    'CCTV Installation & Repair',
    'Interior Design',
    'Modular Kitchen Setup',
    'Home Automation',
    'Curtain & Blind Installation',
    'Glass & Aluminum Work',
    'Masonry/Construction',
    'Gardening & Landscaping',
    'Flooring',
    'POP & False Ceiling',
    'Door & Window Repair',
    'Locksmith Services',
    // Office
    'Electrical Maintenance',
    'HVAC',
    'Office Cleaning & Sanitization',
    'Furniture Installation/Repair',
    'Security Systems',
    'Computer & Printer Repair',
    'Networking & Cabling',
    'Pest Control for Offices',
    'Office Boy/Helper Services',
    'Pantry & Catering Support',
    'Lift/Elevator Maintenance',
    'Fire Safety Installation',
    'IT Support',
    'Co-working Space Setup',
    'Office Interior & Design',
    'Partition & False Ceiling',
    'Office Moving/Relocation',
    'Printing & Stationery Supply',
    'UPS/Inverter Services',
    'Glass Cleaning (Facade)',
    // Transport
    'House Shifting',
    'Office Relocation',
    'Local Tempo/Truck Rental',
    'Intercity Transport',
    'Bike/Car Transport',
    'Packers & Movers',
    'Courier & Parcel Delivery',
    'Furniture Shifting',
    'Heavy Equipment Transport',
    'Mini Truck Services',
    'Storage & Warehousing',
    'Loading/Unloading Labor',
    'Pet Relocation',
    'Event Equipment Transport',
    'Cold Storage Transport',
    'School Van Services',
    'Ambulance Services',
    'Water Tanker Supply',
    'E-commerce Delivery Partner',
    'Vehicle Rental',
    // Personal Care
    'Salon at Home',
    'Spa & Massage',
    'Bridal Makeup',
    'Mehendi Artists',
    'Fitness Trainer',
    'Yoga Instructor',
    'Diet & Nutrition',
    'Physiotherapy at Home',
    'Nursing/Attendant Services',
    'Elder Care',
    'Baby Care/Nanny Services',
    'Counseling & Therapy',
    'Tattoo Artists',
    'Skin Care & Dermatology',
    'Weight Loss Programs',
    'Zumba/Dance Instructor',
    'Speech Therapy',
    'Grooming Workshops',
    'Medical Tests at Home',
    'Homeopathy/Ayurveda',
    // Education & CSR
    'School Tutoring',
    'Competitive Exam Coaching',
    'Spoken English & Communication',
    'Computer Classes',
    'Coding for Kids',
    'Arts & Crafts Classes',
    'Dance & Music Classes',
    'Personality Development',
    'Public Speaking Training',
    'Career Counseling',
    'Corporate Training',
    'Soft Skills Training',
    'CSR – Free Community Tutoring',
    'CSR – Vocational Training',
    'CSR �� Literacy Campaigns',
    'CSR – Health Awareness Workshops',
    'CSR – Environment Education',
    'CSR – Women Empowerment Programs',
    'CSR – Digital Literacy',
    'CSR – Skill Training for Differently Abled',
    // Food & Catering
    'Home Tiffin Service',
    'Event Catering',
    'Birthday Party Catering',
    'Corporate Catering',
    'Wedding Catering',
    'Sweet & Snacks Delivery',
    'Bakeries & Cake Order',
    'Regional Food Specialists',
    'Packed Lunch Supply',
    'Diet Meals',
    'Baby Food Delivery',
    'Personal Chef at Home',
    'Outdoor Catering',
    'Festival Special Food Service',
    'Organic Food Supply',
    'Catering Staff Rental',
    'Beverages & Juice Corner',
    'Food Truck Rental',
    'Health Food & Smoothies',
    'Bulk Meal Supply',
    // Events & Entertainment
    'Wedding Planner',
    'Birthday Party Planner',
    'DJ & Music Bands',
    'Photographers & Videographers',
    'Venue Booking',
    'Decoration & Balloon Art',
    'Sound & Lighting',
    'Stage Setup',
    'Makeup & Styling for Events',
    'Anchors & Hosts',
    'Corporate Event Planner',
    'Festival Event Organizer',
    'Magicians & Artists',
    'Catering Services',
    'Invitation Card Printing',
    'Event Security',
    'Dance Performers',
    'Flower Decoration',
    'Exhibition/Event Stalls',
    'Party Supplies',
    // Tech & Digital Services
    'Website Development',
    'Mobile App Development',
    'SEO & Digital Marketing',
    'Graphic Design',
    'Video Editing',
    'Social Media Management',
    'Logo & Branding',
    'Software Development',
    'Data Entry',
    'Online Ads',
    'Content Writing',
    'Cloud Services',
    'Domain & Hosting',
    'E-commerce Setup',
    'UI/UX Design',
    'Cybersecurity Solutions',
    'ERP/CRM Setup',
    'Freelance Developers',
    'Virtual Assistant Services',
    'IT Consulting',
    // Healthcare
    'Doctor Consultation',
    'Specialist Doctors',
    'Diagnostic Tests',
    'Nursing Services',
    'Physiotherapy',
    'Ambulance Service',
    'Emergency Medicine Delivery',
    'Telemedicine',
    'Health Check-up Packages',
    'Dietician & Nutritionist',
    'Mental Health Counselor',
    'Elderly Care',
    'Baby & Child Specialist',
    'Dental Care',
    'Eye Specialist',
    'Home Sample Collection',
    'Medical Equipment Rental',
    'Homeopathy / Ayurveda',
    'Vaccination Services',
    'Blood Donation / CSR Health Camps',
  ];

  types: Array<ListingItem['type']> = ['Sell', 'Rent', 'Exchange', 'Service'];

  private serviceTypeMap: Record<string, string[]> = {
    Plumbing: ['Leak Fix', 'Pipe Installation', 'Bathroom Fittings', 'Kitchen Plumbing'],
    Electrical: ['Wiring Service', 'Appliance Install', 'Lighting Setup', 'Panel Repair'],
    Cleaning: ['Home Cleaning', 'Deep Cleaning', 'Office Cleaning', 'Sofa Shampoo'],
    Tutoring: ['Math Tuition', 'English Coaching', 'Science Tutor', 'Exam Prep'],
    Carpentry: ['Furniture Repair', 'Custom Shelves', 'Door Fix', 'Wardrobe Build'],
    Painting: ['Interior Paint', 'Exterior Paint', 'Texture Work', 'Ceiling Paint'],
    Moving: ['House Shifting', 'Office Relocation', 'Packing Service', 'Local Transport'],
    'Appliance Repair': ['AC Repair', 'Fridge Repair', 'Washer Repair', 'Microwave Fix'],
  };

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
        for (let i = 0; i < 10; i++) {
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
          const title = this.createTitle(cat, typ, i);
          const serviceType = title.split(' - ')[0];
          out.push({
            id: id++,
            title,
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
            serviceType,
          });
        }
      }
    }
    return out;
  }

  private posted(): ListingItem[] {
    return this.ads.getAll().map((ad) => {
      const st = (ad.title || '').split(' - ')[0].trim() || ad.title;
      return {
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
        serviceType: st,
      } as ListingItem;
    });
  }

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
    // if (this.filters.location)
    //   out = out.filter((i) =>
    //     i.location.toLowerCase().includes(this.filters.location.toLowerCase()),
    //   );

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

  // Availability tag (mocked deterministically)
  availabilityLabel(it: ListingItem): 'Currently Available' | 'Available for Call' {
    return it.id % 2 === 0 ? 'Currently Available' : 'Available for Call';
  }

  // Geo utilities for distance
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
    this.locDebounce = setTimeout(() => this.queryNominatim(value.trim()), 300);
  }

  selectLocation(item: { display_name: string; lat: string; lon: string }) {
    this.filters.location = item.display_name;
    this.locationResults = [];
    this.setPage(1);
  }

  private queryNominatim(q: string) {
    this.locationLoading = true;
    const left = 68.176645,
      right = 97.395561,
      bottom = 6.554607,
      top = 35.674545; // India bbox
    const params = new URLSearchParams({
      format: 'jsonv2',
      addressdetails: '1',
      namedetails: '1',
      extratags: '0',
      limit: '8',
      countrycodes: 'in',
      viewbox: `${left},${top},${right},${bottom}`,
      bounded: '1',
      'accept-language': 'en-IN,hi-IN',
      q,
    });
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        const allowed = new Set([
          'city',
          'town',
          'village',
          'suburb',
          'state',
          'district',
          'county',
          'locality',
        ]);
        const onlyIn = (res || []).filter(
          (r) => (r.address?.country_code || '').toLowerCase() === 'in',
        );
        const cleaned = (onlyIn.length ? onlyIn : res || []).filter((r) =>
          allowed.has((r.type || '').toLowerCase()),
        );
        this.locationResults = cleaned.slice(0, 8);
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

  private applySlug(slug: string | null) {
    if (!slug) return;
    const s = slug.toLowerCase();

    const typeMap: Record<string, ListingItem['type']> = {
      sell: 'Sell',
      rent: 'Rent',
      exchange: 'Exchange',
      service: 'Service',
    };

    const catBySlug: Record<string, string> = this.categories.reduce(
      (acc, c) => {
        acc[this.slugify(c)] = c;
        return acc;
      },
      {} as Record<string, string>,
    );

    const tokens = s.split('-').filter(Boolean);
    for (const tk of tokens) {
      if (typeMap[tk]) this.filters.type = typeMap[tk];
    }

    let assignedCat = '';
    for (const [slugCat, original] of Object.entries(catBySlug)) {
      if (
        s === slugCat ||
        s.endsWith('-' + slugCat) ||
        s.startsWith(slugCat + '-') ||
        s.includes('-' + slugCat + '-')
      ) {
        assignedCat = original;
        break;
      }
    }
    if (assignedCat) this.filters.category = assignedCat;
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

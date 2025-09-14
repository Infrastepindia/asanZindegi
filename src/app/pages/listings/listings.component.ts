import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdsService } from '../../services/ads.service';
import { ApiService, ApiSuperCategory } from '../../services/api.service';

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
  private api = inject(ApiService);
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const cat = this.route.snapshot.queryParamMap.get('category') || '';
    const loc = this.route.snapshot.queryParamMap.get('location') || '';
    if (cat) this.filters.selectedCategories = [cat];
    if (loc) this.filters.location = loc;
    if (cat || loc) this.setPage(1);

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
      this.filters.location = l;
      this.setPage(1);
    });
  }
  filters = {
    selectedCategories: [] as string[],
    location: '',
    minRating: 0 as number,
    verified: 'all' as 'all' | 'verified' | 'unverified',
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
    'CSR – Literacy Campaigns',
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
    if (this.filters.selectedCategories.length)
      out = out.filter((i) => this.filters.selectedCategories.includes(i.category));
    if (this.filters.location)
      out = out.filter((i) =>
        i.location.toLowerCase().includes(this.filters.location.toLowerCase()),
      );

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

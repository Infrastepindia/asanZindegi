import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiService, ApiSuperCategory } from '../../services/api.service';

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
export class LandingComponent implements OnInit {
  constructor() {}

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

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly year = new Date().getFullYear();

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

  // Super-category model and AI-derived grouping
  superCategories: Array<{
    key:
      | 'house-hold'
      | 'office-needs'
      | 'transport'
      | 'personal-care'
      | 'education-csr'
      | 'food-catering'
      | 'events-entertainment'
      | 'tech-digital'
      | 'healthcare';
    title: string;
    colorClass: string;
    icon: string;
    categoryNames: string[];
  }> = [
    {
      key: 'house-hold',
      title: 'Household Services',
      colorClass: 'supercat-household',
      icon: 'bi-house',
      categoryNames: [
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
      ],
    },
    {
      key: 'office-needs',
      title: 'Office & Commercial Services',
      colorClass: 'supercat-office',
      icon: 'bi-building',
      categoryNames: [
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
      ],
    },
    {
      key: 'transport',
      title: 'Transport & Logistics',
      colorClass: 'supercat-transport',
      icon: 'bi-truck',
      categoryNames: [
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
      ],
    },
    {
      key: 'personal-care',
      title: 'Personal Care & Wellness',
      colorClass: 'supercat-personal',
      icon: 'bi-heart-pulse',
      categoryNames: [
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
      ],
    },
    {
      key: 'education-csr',
      title: 'Education & CSR',
      colorClass: 'supercat-education',
      icon: 'bi-book',
      categoryNames: [
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
      ],
    },
    {
      key: 'food-catering',
      title: 'Food & Catering',
      colorClass: 'supercat-food',
      icon: 'bi-basket',
      categoryNames: [
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
      ],
    },
    {
      key: 'events-entertainment',
      title: 'Events & Entertainment',
      colorClass: 'supercat-events',
      icon: 'bi-stars',
      categoryNames: [
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
      ],
    },
    {
      key: 'tech-digital',
      title: 'Tech & Digital Services',
      colorClass: 'supercat-tech',
      icon: 'bi-cpu',
      categoryNames: [
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
      ],
    },
    {
      key: 'healthcare',
      title: 'Healthcare & Medical Support',
      colorClass: 'supercat-healthcare',
      icon: 'bi-hospital',
      categoryNames: [
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
      ],
    },
  ];

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
    if (this.search.superCategory) params.super = this.search.superCategory;
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

  iconClass(icon?: string): string[] {
    if (!icon) return [];
    if (icon.startsWith('fa-')) return ['fa-solid', icon];
    if (icon.startsWith('bi-')) return ['bi', icon];
    return [icon];
  }
}

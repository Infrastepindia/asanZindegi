import { Component, inject, OnInit } from '@angular/core';
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
        this.superCategoryOptions = this.apiSuperCategories.map((s) => ({ key: s.id, title: s.title }));
        this.visibleSuperCategories = this.apiSuperCategories.map((s) => ({
          key: s.id,
          title: s.title,
          colorClass: s.colorClass,
          icon: s.icon,
          items: s.categories.map((c) => ({ name: c.name, icon: c.icon, count: c.count })),
        }));
      },
      error: () => {
        this.apiSuperCategories = [];
        this.superCategoryOptions = [];
        this.visibleSuperCategories = [];
      },
    });
  }

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);

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

  categories: CategoryItem[] = [
    // Household Services
    { name: 'Plumbing', icon: 'bi-tools', count: 128 },
    { name: 'Electrical Repair', icon: 'bi-lightning-charge', count: 102 },
    { name: 'Carpentry', icon: 'bi-hammer', count: 63 },
    { name: 'Painting & Whitewashing', icon: 'bi-brush', count: 58 },
    { name: 'Home Cleaning', icon: 'bi-bucket', count: 210 },
    { name: 'Appliance Repair', icon: 'bi-tools', count: 145 },
    { name: 'Pest Control', icon: 'bi-bug', count: 52 },
    { name: 'RO/Water Purifier Service', icon: 'bi-droplet', count: 38 },
    { name: 'CCTV Installation & Repair', icon: 'bi-camera-video', count: 41 },
    { name: 'Interior Design', icon: 'bi-house', count: 27 },
    { name: 'Modular Kitchen Setup', icon: 'bi-grid-1x2', count: 22 },
    { name: 'Home Automation', icon: 'bi-gear', count: 19 },
    { name: 'Curtain & Blind Installation', icon: 'bi-window', count: 24 },
    { name: 'Glass & Aluminum Work', icon: 'bi-window', count: 18 },
    { name: 'Masonry/Construction', icon: 'bi-building', count: 35 },
    { name: 'Gardening & Landscaping', icon: 'bi-flower3', count: 29 },
    { name: 'Flooring', icon: 'bi-grid-3x3-gap', count: 33 },
    { name: 'POP & False Ceiling', icon: 'bi-grid', count: 21 },
    { name: 'Door & Window Repair', icon: 'bi-door-closed', count: 26 },
    { name: 'Locksmith Services', icon: 'bi-key', count: 17 },

    // Office & Commercial Services
    { name: 'Electrical Maintenance', icon: 'bi-lightning-charge', count: 64 },
    { name: 'HVAC', icon: 'bi-thermometer-half', count: 31 },
    { name: 'Office Cleaning & Sanitization', icon: 'bi-bucket', count: 72 },
    { name: 'Furniture Installation/Repair', icon: 'bi-wrench', count: 28 },
    { name: 'Security Systems', icon: 'bi-shield-lock', count: 36 },
    { name: 'Computer & Printer Repair', icon: 'bi-printer', count: 44 },
    { name: 'Networking & Cabling', icon: 'bi-diagram-3', count: 39 },
    { name: 'Pest Control for Offices', icon: 'bi-bug', count: 25 },
    { name: 'Office Boy/Helper Services', icon: 'bi-person-workspace', count: 20 },
    { name: 'Pantry & Catering Support', icon: 'bi-cup-hot', count: 22 },
    { name: 'Lift/Elevator Maintenance', icon: 'bi-building', count: 14 },
    { name: 'Fire Safety Installation', icon: 'bi-fire', count: 19 },
    { name: 'IT Support', icon: 'bi-headset', count: 33 },
    { name: 'Co-working Space Setup', icon: 'bi-people', count: 12 },
    { name: 'Office Interior & Design', icon: 'bi-building', count: 18 },
    { name: 'Partition & False Ceiling', icon: 'bi-grid-1x2', count: 21 },
    { name: 'Office Moving/Relocation', icon: 'bi-truck', count: 27 },
    { name: 'Printing & Stationery Supply', icon: 'bi-printer', count: 26 },
    { name: 'UPS/Inverter Services', icon: 'bi-battery-charging', count: 16 },
    { name: 'Glass Cleaning (Facade)', icon: 'bi-window', count: 13 },

    // Transport & Logistics
    { name: 'House Shifting', icon: 'bi-truck', count: 34 },
    { name: 'Office Relocation', icon: 'bi-truck', count: 22 },
    { name: 'Local Tempo/Truck Rental', icon: 'bi-truck', count: 31 },
    { name: 'Intercity Transport', icon: 'bi-geo-alt', count: 28 },
    { name: 'Bike/Car Transport', icon: 'bi-car-front', count: 19 },
    { name: 'Packers & Movers', icon: 'bi-box-seam', count: 37 },
    { name: 'Courier & Parcel Delivery', icon: 'bi-send', count: 44 },
    { name: 'Furniture Shifting', icon: 'bi-box', count: 23 },
    { name: 'Heavy Equipment Transport', icon: 'bi-truck', count: 11 },
    { name: 'Mini Truck Services', icon: 'bi-truck', count: 18 },
    { name: 'Storage & Warehousing', icon: 'bi-box-seam', count: 16 },
    { name: 'Loading/Unloading Labor', icon: 'bi-people', count: 21 },
    { name: 'Pet Relocation', icon: 'bi-heart', count: 9 },
    { name: 'Event Equipment Transport', icon: 'bi-speaker', count: 8 },
    { name: 'Cold Storage Transport', icon: 'bi-snow', count: 7 },
    { name: 'School Van Services', icon: 'bi-bus-front', count: 10 },
    { name: 'Ambulance Services', icon: 'bi-hospital', count: 12 },
    { name: 'Water Tanker Supply', icon: 'bi-droplet', count: 14 },
    { name: 'E-commerce Delivery Partner', icon: 'bi-bag', count: 20 },
    { name: 'Vehicle Rental', icon: 'bi-car-front', count: 24 },

    // Personal Care & Wellness
    { name: 'Salon at Home', icon: 'bi-scissors', count: 42 },
    { name: 'Spa & Massage', icon: 'bi-flower1', count: 33 },
    { name: 'Bridal Makeup', icon: 'bi-brush', count: 18 },
    { name: 'Mehendi Artists', icon: 'bi-palette', count: 15 },
    { name: 'Fitness Trainer', icon: 'bi-heart-pulse', count: 22 },
    { name: 'Yoga Instructor', icon: 'bi-peace', count: 19 },
    { name: 'Diet & Nutrition', icon: 'bi-heart', count: 21 },
    { name: 'Physiotherapy at Home', icon: 'bi-clipboard2-pulse', count: 17 },
    { name: 'Nursing/Attendant Services', icon: 'bi-hospital', count: 14 },
    { name: 'Elder Care', icon: 'bi-person', count: 16 },
    { name: 'Baby Care/Nanny Services', icon: 'bi-baby', count: 12 },
    { name: 'Counseling & Therapy', icon: 'bi-chat-heart', count: 10 },
    { name: 'Tattoo Artists', icon: 'bi-pen', count: 8 },
    { name: 'Skin Care & Dermatology', icon: 'bi-sun', count: 9 },
    { name: 'Weight Loss Programs', icon: 'bi-graph-down', count: 7 },
    { name: 'Zumba/Dance Instructor', icon: 'bi-music-note-beamed', count: 11 },
    { name: 'Speech Therapy', icon: 'bi-mic', count: 6 },
    { name: 'Grooming Workshops', icon: 'bi-brush', count: 5 },
    { name: 'Medical Tests at Home', icon: 'bi-clipboard2-pulse', count: 13 },
    { name: 'Homeopathy/Ayurveda', icon: 'bi-flower2', count: 9 },

    // Education & CSR
    { name: 'School Tutoring', icon: 'bi-book', count: 76 },
    { name: 'Competitive Exam Coaching', icon: 'bi-book-half', count: 31 },
    { name: 'Spoken English & Communication', icon: 'bi-chat', count: 28 },
    { name: 'Computer Classes', icon: 'bi-pc-display', count: 25 },
    { name: 'Coding for Kids', icon: 'bi-code', count: 19 },
    { name: 'Arts & Crafts Classes', icon: 'bi-palette', count: 22 },
    { name: 'Dance & Music Classes', icon: 'bi-music-note-list', count: 24 },
    { name: 'Personality Development', icon: 'bi-person', count: 18 },
    { name: 'Public Speaking Training', icon: 'bi-megaphone', count: 12 },
    { name: 'Career Counseling', icon: 'bi-briefcase', count: 14 },
    { name: 'Corporate Training', icon: 'bi-building', count: 13 },
    { name: 'Soft Skills Training', icon: 'bi-people', count: 17 },
    { name: 'CSR – Free Community Tutoring', icon: 'bi-people', count: 8 },
    { name: 'CSR – Vocational Training', icon: 'bi-tools', count: 9 },
    { name: 'CSR – Literacy Campaigns', icon: 'bi-journal', count: 7 },
    { name: 'CSR – Health Awareness Workshops', icon: 'bi-heart-pulse', count: 6 },
    { name: 'CSR – Environment Education', icon: 'bi-globe', count: 6 },
    { name: 'CSR – Women Empowerment Programs', icon: 'bi-gender-female', count: 5 },
    { name: 'CSR – Digital Literacy', icon: 'bi-laptop', count: 8 },
    { name: 'CSR – Skill Training for Differently Abled', icon: 'bi-person-wheelchair', count: 4 },

    // Food & Catering
    { name: 'Home Tiffin Service', icon: 'bi-basket', count: 33 },
    { name: 'Event Catering', icon: 'bi-basket', count: 29 },
    { name: 'Birthday Party Catering', icon: 'bi-gift', count: 21 },
    { name: 'Corporate Catering', icon: 'bi-briefcase', count: 18 },
    { name: 'Wedding Catering', icon: 'bi-gem', count: 16 },
    { name: 'Sweet & Snacks Delivery', icon: 'bi-bag-heart', count: 20 },
    { name: 'Bakeries & Cake Order', icon: 'bi-cup-hot', count: 24 },
    { name: 'Regional Food Specialists', icon: 'bi-geo-alt', count: 12 },
    { name: 'Packed Lunch Supply', icon: 'bi-box', count: 22 },
    { name: 'Diet Meals', icon: 'bi-heart', count: 14 },
    { name: 'Baby Food Delivery', icon: 'bi-baby', count: 9 },
    { name: 'Personal Chef at Home', icon: 'bi-egg', count: 8 },
    { name: 'Outdoor Catering', icon: 'bi-basket', count: 10 },
    { name: 'Festival Special Food Service', icon: 'bi-stars', count: 7 },
    { name: 'Organic Food Supply', icon: 'bi-flower2', count: 6 },
    { name: 'Catering Staff Rental', icon: 'bi-people', count: 11 },
    { name: 'Beverages & Juice Corner', icon: 'bi-cup-straw', count: 9 },
    { name: 'Food Truck Rental', icon: 'bi-truck', count: 5 },
    { name: 'Health Food & Smoothies', icon: 'bi-heart', count: 8 },
    { name: 'Bulk Meal Supply', icon: 'bi-box-seam', count: 12 },

    // Events & Entertainment
    { name: 'Wedding Planner', icon: 'bi-gem', count: 14 },
    { name: 'Birthday Party Planner', icon: 'bi-gift', count: 18 },
    { name: 'DJ & Music Bands', icon: 'bi-music-note-beamed', count: 16 },
    { name: 'Photographers & Videographers', icon: 'bi-camera', count: 27 },
    { name: 'Venue Booking', icon: 'bi-geo-alt', count: 13 },
    { name: 'Decoration & Balloon Art', icon: 'bi-balloon', count: 15 },
    { name: 'Sound & Lighting', icon: 'bi-speaker', count: 12 },
    { name: 'Stage Setup', icon: 'bi-easel', count: 9 },
    { name: 'Makeup & Styling for Events', icon: 'bi-brush', count: 10 },
    { name: 'Anchors & Hosts', icon: 'bi-mic', count: 8 },
    { name: 'Corporate Event Planner', icon: 'bi-briefcase', count: 7 },
    { name: 'Festival Event Organizer', icon: 'bi-stars', count: 9 },
    { name: 'Magicians & Artists', icon: 'bi-stars', count: 6 },
    { name: 'Catering Services', icon: 'bi-basket', count: 11 },
    { name: 'Invitation Card Printing', icon: 'bi-envelope', count: 10 },
    { name: 'Event Security', icon: 'bi-shield-lock', count: 6 },
    { name: 'Dance Performers', icon: 'bi-people', count: 8 },
    { name: 'Flower Decoration', icon: 'bi-flower2', count: 7 },
    { name: 'Exhibition/Event Stalls', icon: 'bi-shop', count: 5 },
    { name: 'Party Supplies', icon: 'bi-bag', count: 12 },

    // Tech & Digital Services
    { name: 'Website Development', icon: 'bi-window-sidebar', count: 23 },
    { name: 'Mobile App Development', icon: 'bi-phone', count: 19 },
    { name: 'SEO & Digital Marketing', icon: 'bi-graph-up', count: 21 },
    { name: 'Graphic Design', icon: 'bi-palette', count: 24 },
    { name: 'Video Editing', icon: 'bi-camera-reels', count: 18 },
    { name: 'Social Media Management', icon: 'bi-share', count: 22 },
    { name: 'Logo & Branding', icon: 'bi-type', count: 17 },
    { name: 'Software Development', icon: 'bi-braces', count: 20 },
    { name: 'Data Entry', icon: 'bi-table', count: 13 },
    { name: 'Online Ads', icon: 'bi-badge-ad', count: 16 },
    { name: 'Content Writing', icon: 'bi-pen', count: 14 },
    { name: 'Cloud Services', icon: 'bi-cloud', count: 11 },
    { name: 'Domain & Hosting', icon: 'bi-hdd-network', count: 9 },
    { name: 'E-commerce Setup', icon: 'bi-cart', count: 12 },
    { name: 'UI/UX Design', icon: 'bi-layout-text-window', count: 10 },
    { name: 'Cybersecurity Solutions', icon: 'bi-shield-lock', count: 8 },
    { name: 'ERP/CRM Setup', icon: 'bi-diagram-3', count: 7 },
    { name: 'Freelance Developers', icon: 'bi-people', count: 9 },
    { name: 'Virtual Assistant Services', icon: 'bi-headset', count: 8 },
    { name: 'IT Consulting', icon: 'bi-chat-dots', count: 11 },

    // Healthcare & Medical Support
    { name: 'Doctor Consultation', icon: 'bi-clipboard2-pulse', count: 18 },
    { name: 'Specialist Doctors', icon: 'bi-hospital', count: 16 },
    { name: 'Diagnostic Tests', icon: 'bi-clipboard2-pulse', count: 14 },
    { name: 'Nursing Services', icon: 'bi-hospital', count: 12 },
    { name: 'Physiotherapy', icon: 'bi-heart-pulse', count: 13 },
    { name: 'Ambulance Service', icon: 'bi-hospital', count: 9 },
    { name: 'Emergency Medicine Delivery', icon: 'bi-capsule', count: 11 },
    { name: 'Telemedicine', icon: 'bi-camera-video', count: 10 },
    { name: 'Health Check-up Packages', icon: 'bi-clipboard2-check', count: 12 },
    { name: 'Dietician & Nutritionist', icon: 'bi-heart', count: 10 },
    { name: 'Mental Health Counselor', icon: 'bi-emoji-smile', count: 8 },
    { name: 'Elderly Care', icon: 'bi-person', count: 9 },
    { name: 'Baby & Child Specialist', icon: 'bi-baby', count: 7 },
    { name: 'Dental Care', icon: 'bi-emoji-smile', count: 8 },
    { name: 'Eye Specialist', icon: 'bi-eye', count: 9 },
    { name: 'Home Sample Collection', icon: 'bi-box', count: 7 },
    { name: 'Medical Equipment Rental', icon: 'bi-gear', count: 6 },
    { name: 'Homeopathy / Ayurveda', icon: 'bi-flower2', count: 6 },
    { name: 'Vaccination Services', icon: 'bi-syringe', count: 7 },
    { name: 'Blood Donation / CSR Health Camps', icon: 'bi-droplet-half', count: 5 },
  ];

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

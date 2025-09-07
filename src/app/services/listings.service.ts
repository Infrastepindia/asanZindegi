import { Injectable } from '@angular/core';
import { Category } from '../models/category.model';
import { ServiceType } from '../models/service-type.model';
import { Provider } from '../models/provider.model';

export interface ListingItem {
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

@Injectable({ providedIn: 'root' })
export class ListingsService {
  // Relational data
  private categoriesData: Category[] = [
    'Plumbing',
    'Electrical',
    'Cleaning',
    'Tutoring',
    'Carpentry',
    'Painting',
    'Moving',
    'Appliance Repair',
  ].map((name, idx) => ({ id: idx + 1, name }));

  private serviceTypesData: ServiceType[] = [
    { cat: 'Plumbing', types: ['Leak Fix', 'Pipe Installation', 'Bathroom Fittings'] },
    { cat: 'Electrical', types: ['Wiring', 'Appliance Install', 'Lighting'] },
    { cat: 'Cleaning', types: ['Home Cleaning', 'Deep Cleaning', 'Office Cleaning'] },
    { cat: 'Tutoring', types: ['Math', 'English', 'Science'] },
    { cat: 'Carpentry', types: ['Furniture Repair', 'Custom Shelves'] },
    { cat: 'Painting', types: ['Interior', 'Exterior'] },
    { cat: 'Moving', types: ['House Shifting', 'Office Relocation'] },
    { cat: 'Appliance Repair', types: ['AC Repair', 'Fridge Repair', 'Washing Machine Repair'] },
  ].flatMap(({ cat, types }, baseIdx) => {
    const category = this.categoriesData.find((c) => c.name === cat)!;
    return types.map(
      (name, i) => ({ id: baseIdx * 10 + i + 1, name, categoryId: category.id }) as ServiceType,
    );
  });

  private providersData: Provider[] = [
    { id: 1, name: 'Provider Demo', categoryId: 1, avatar: 'https://i.pravatar.cc/100?img=12' },
    { id: 2, name: 'Leslie Davis', categoryId: 3, avatar: 'https://i.pravatar.cc/100?img=32' },
    { id: 3, name: 'Marcus Hassan', categoryId: 5, avatar: 'https://i.pravatar.cc/100?img=56' },
  ];

  // Non-relational helper for existing UI
  private categories = this.categoriesData.map((c) => c.name);

  // listingId -> serviceTypeIds (many-to-many)
  private listingServiceTypes: Record<number, number[]> = {};

  private types: Array<ListingItem['type']> = ['Sell', 'Rent', 'Exchange', 'Service'];

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

  getAll(): ListingItem[] {
    const rnd = this.prng(42);
    const out: ListingItem[] = [];
    this.listingServiceTypes = {};
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
          const listingId = id++;
          const categoryId = this.categoriesData.find((c) => c.name === cat)!.id;
          const typesForCat = this.serviceTypesData.filter((t) => t.categoryId === categoryId);
          const chosen: number[] = [];
          for (let k = 0; k < Math.min(3, typesForCat.length); k++) {
            const tIdx = (i + k) % typesForCat.length;
            chosen.push(typesForCat[tIdx].id);
          }
          this.listingServiceTypes[listingId] = chosen;

          out.push({
            id: listingId,
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

  getById(id: number): ListingItem | undefined {
    return this.getAll().find((i) => i.id === id);
  }

  // Relations API
  getCategories(): Category[] {
    return this.categoriesData.slice();
  }
  getServiceTypes(): ServiceType[] {
    return this.serviceTypesData.slice();
  }
  getServiceTypesByCategoryName(name: string): ServiceType[] {
    const cat = this.categoriesData.find((c) => c.name === name);
    if (!cat) return [];
    return this.serviceTypesData.filter((t) => t.categoryId === cat.id);
  }
  getProvidersByCategoryName(name: string): Provider[] {
    const cat = this.categoriesData.find((c) => c.name === name);
    if (!cat) return [];
    return this.providersData.filter((p) => p.categoryId === cat.id);
  }
  getServiceTypesForListing(listingId: number): ServiceType[] {
    const ids = this.listingServiceTypes[listingId] || [];
    const byId = new Map(this.serviceTypesData.map((t) => [t.id, t] as const));
    return ids.map((id) => byId.get(id)!).filter(Boolean);
  }
}

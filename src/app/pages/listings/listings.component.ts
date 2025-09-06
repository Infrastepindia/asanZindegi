import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
}

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listings.component.html',
  styleUrl: './listings.component.css'
})
export class ListingsComponent {
  filters = {
    category: '',
    type: '',
    location: '',
    minPrice: '',
    maxPrice: ''
  };

  categories = [
    'Plumbing','Electrical','Cleaning','Tutoring','Carpentry','Painting','Moving','Appliance Repair'
  ];

  types: Array<ListingItem['type']> = ['Sell','Rent','Exchange','Service'];

  all: ListingItem[] = [
    { id:1, title:'Apartment for Rent', category:'Apartments & Flats', type:'Rent', location:'Delhi, India', price:15000, unit:'per month', cover:'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop', date:'2025-08-01', views:512, rating:5 },
    { id:2, title:'Property for Rent', category:'Houses, Property', type:'Rent', location:'Hyderabad, India', price:2500, unit:'per month', cover:'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop', date:'2025-08-05', views:342, rating:4 },
    { id:3, title:'Ultrabook 2018 Core i7', category:'Computers & Laptops', type:'Sell', location:'Kolkata, India', price:13000, cover:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop', date:'2025-08-07', views:197, rating:5 },
    { id:4, title:'Radar Rabbit', category:'Pets', type:'Sell', location:'New Delhi, India', price:340, cover:'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=1200&auto=format&fit=crop', date:'2025-07-15', views:98, rating:4 },
    { id:5, title:'Gray Angelfish', category:'Fish', type:'Sell', location:'Lucknow, India', price:220, cover:'https://images.unsplash.com/photo-1507057269201-4dce9f9e07b8?q=80&w=1200&auto=format&fit=crop', date:'2025-07-18', views:77, rating:4 },
    { id:6, title:'Cream Legbar Hybrid', category:'Chickens', type:'Sell', location:'Chennai, India', price:120, cover:'https://images.unsplash.com/photo-1517451330947-7809dead78d7?q=80&w=1200&auto=format&fit=crop', date:'2025-07-20', views:65, rating:5 },
    { id:7, title:'Rambo Cat', category:'Cats', type:'Sell', location:'Ahmedabad, India', price:220, cover:'https://images.unsplash.com/photo-1519052537406-0f3d2d7c1a2a?q=80&w=1200&auto=format&fit=crop', date:'2025-06-28', views:301, rating:5 },
    { id:8, title:'Pomeranian', category:'Dogs', type:'Exchange', location:'Pune, India', price:0, cover:'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop', date:'2025-06-10', views:412, rating:4 },
    { id:9, title:'Macaw Parrot', category:'Birds', type:'Sell', location:'Kochi, India', price:978, cover:'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=1200&auto=format&fit=crop', date:'2025-06-05', views:143, rating:5 },
    { id:10, title:'Local Mixed Dog', category:'Dogs', type:'Exchange', location:'Mumbai, India', price:350, cover:'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200&auto=format&fit=crop', date:'2025-05-22', views:260, rating:4 }
  ];

  page = 1;
  perPage = 5;

  get filtered(): ListingItem[] {
    let out = this.all.slice();
    if (this.filters.category) out = out.filter(i => i.category === this.filters.category);
    if (this.filters.type) out = out.filter(i => i.type === (this.filters.type as any));
    if (this.filters.location) out = out.filter(i => i.location.toLowerCase().includes(this.filters.location.toLowerCase()));
    const min = this.filters.minPrice ? parseFloat(this.filters.minPrice) : null;
    const max = this.filters.maxPrice ? parseFloat(this.filters.maxPrice) : null;
    if (min !== null) out = out.filter(i => i.price >= (min as number));
    if (max !== null) out = out.filter(i => i.price <= (max as number));
    return out;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.perPage));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
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

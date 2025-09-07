import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ListingsService, ListingItem } from '../../services/listings.service';

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
}

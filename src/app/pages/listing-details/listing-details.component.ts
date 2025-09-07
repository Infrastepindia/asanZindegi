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

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!isNaN(id)) {
      this.item = this.svc.getById(id);
    }
  }
}

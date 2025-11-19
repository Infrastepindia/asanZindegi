import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobileListingDetailsComponent } from './mobile-listing-details.component';
import { DesktopListingDetailsComponent } from './desktop-listing-details.component';

@Component({
  selector: 'app-listing-details',
  standalone: true,
  imports: [CommonModule, MobileListingDetailsComponent, DesktopListingDetailsComponent],
  templateUrl: './listing-details.component.html',
  styleUrl: './listing-details.component.css',
})
export class ListingDetailsComponent implements OnInit, OnDestroy {
  isMobileView = false;
  private resizeListener?: () => void;

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', this.handleResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    this.checkScreenSize();
  };

  private checkScreenSize(): void {
    this.isMobileView = window.innerWidth < 768;
  }
}

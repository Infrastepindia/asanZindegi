import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobileListingsComponent } from './mobile-listings.component';
import { DesktopListingsComponent } from './desktop-listings.component';

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [CommonModule, MobileListingsComponent, DesktopListingsComponent],
  templateUrl: './listings.component.html',
  styleUrl: './listings.component.css',
})
export class ListingsComponent implements OnInit, OnDestroy {
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

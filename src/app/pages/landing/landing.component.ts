import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobileLandingComponent } from './mobile-landing.component';
import { DesktopLandingComponent } from './desktop-landing.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, MobileLandingComponent, DesktopLandingComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit, OnDestroy {
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

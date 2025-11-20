import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiSuperCategory, ApiCategory, ApiService } from '../../services/api.service';
import { PhotonService, LocationResult } from '../../services/photon.service';
import { CityService } from '../../shared/city.service';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError } from 'rxjs/operators';
import { BehaviorSubject, of } from 'rxjs';

type NominatimResult = LocationResult;

@Component({
  selector: 'app-category-selection-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-selection-page.component.html',
  styleUrl: './category-selection-page.component.css',
})
export class CategorySelectionPageComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private photon = inject(PhotonService);
  private cdr = inject(ChangeDetectorRef);
  private cityService = inject(CityService);

  supercategory: ApiSuperCategory | null = null;
  supercategoryId: number | null = null;
  preSelectedCategoryName: string | null = null;

  // Location search
  locationInput = '';
  locationSuggestions: NominatimResult[] = [];
  locationOpen = false;
  locationLoading = false;
  selectedLocation: NominatimResult | null = null;

  // Category selection
  selectedCategory: ApiCategory | null = null;

  private locationQuery$ = new BehaviorSubject<string>('');

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('supercategoryId');
    const categoryName = this.route.snapshot.queryParamMap.get('category');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    this.supercategoryId = parseInt(id, 10);
    this.preSelectedCategoryName = categoryName;
    this.api.getCategories().subscribe({
      next: (res) => {
        const categories = (res as any).data || [];
        this.supercategory =
          categories.find((c: ApiSuperCategory) => c.id === this.supercategoryId) || null;
        if (!this.supercategory) {
          this.router.navigate(['/']);
        } else if (this.preSelectedCategoryName && this.supercategory.categories) {
          const preSelected = this.supercategory.categories.find(
            (c) => c.name === this.preSelectedCategoryName,
          );
          if (preSelected) {
            this.selectedCategory = preSelected;
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.router.navigate(['/']);
      },
    });

    // Setup location search debounce
    this.locationQuery$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((q) => q.trim().length > 0),
        switchMap((q) => this.searchLocation(q)),
        catchError(() => of([] as NominatimResult[])),
      )
      .subscribe((res) => {
        this.locationSuggestions = res;
        this.cdr.detectChanges();
      });
  }

  onLocationInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.locationInput = input.value;
    this.locationOpen = true;
    this.locationQuery$.next(this.locationInput);
  }

  onLocationBlur(): void {
    setTimeout(() => {
      this.locationOpen = false;
    }, 150);
  }

  selectLocation(location: NominatimResult): void {
    this.selectedLocation = location;
    this.locationInput = location.display_name;
    this.locationOpen = false;
    this.locationSuggestions = [];
  }

  isFormValid(): boolean {
    return this.selectedLocation !== null && this.selectedCategory !== null;
  }

  onSubmit(): void {
    if (!this.isFormValid() || !this.selectedLocation || !this.selectedCategory) {
      return;
    }

    const queryParams: any = {
      supercategory: this.supercategoryId,
      category: this.selectedCategory.name,
      location: this.selectedLocation.display_name,
      lat: parseFloat(this.selectedLocation.lat),
      lon: parseFloat(this.selectedLocation.lon),
    };

    this.router.navigate(['/listings'], { queryParams });
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }

  private searchLocation(q: string) {
    const currentCity = this.cityService.city();
    const bounds = currentCity ? this.cityService.getBoundsForCity(currentCity) : null;

    let lat: number | undefined;
    let lon: number | undefined;

    if (bounds) {
      lat = (bounds.bottom + bounds.top) / 2;
      lon = (bounds.left + bounds.right) / 2;
    }

    return this.photon.searchLocation(q, 'IN', 8, lat, lon);
  }

  iconClass(icon?: string): string[] {
    if (!icon) return [];
    if (icon.startsWith('fa-')) return ['fa-solid', icon];
    if (icon.startsWith('bi-')) return ['bi', icon];
    return [icon];
  }
}

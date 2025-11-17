import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiSuperCategory, ApiCategory } from '../../services/api.service';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError } from 'rxjs/operators';
import { BehaviorSubject, of } from 'rxjs';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  class: string;
  type: string;
  address?: Record<string, string>;
}

interface CategorySelectionResult {
  supercategoryId: number;
  supercategoryTitle: string;
  categoryId: number;
  categoryName: string;
  location: string;
  lat: number;
  lon: number;
}

@Component({
  selector: 'app-category-selection-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-selection-modal.component.html',
  styleUrl: './category-selection-modal.component.css',
})
export class CategorySelectionModalComponent implements OnInit {
  @Input() supercategory!: ApiSuperCategory;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<CategorySelectionResult>();

  // Location search
  locationInput = '';
  locationSuggestions: NominatimResult[] = [];
  locationOpen = false;
  locationLoading = false;
  selectedLocation: NominatimResult | null = null;

  // Category selection
  selectedCategory: ApiCategory | null = null;

  private locationQuery$ = new BehaviorSubject<string>('');
  private locationDebounceSubscription: any;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (!this.supercategory) {
      this.closed.emit();
      return;
    }

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
        this.locationSuggestions = this.filterLocationResults(res);
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
    if (!this.isFormValid() || !this.selectedLocation) {
      return;
    }

    const result: CategorySelectionResult = {
      supercategoryId: this.supercategory.id,
      supercategoryTitle: this.supercategory.title,
      categoryId: this.selectedCategory!.id,
      categoryName: this.selectedCategory!.name,
      location: this.selectedLocation.display_name,
      lat: parseFloat(this.selectedLocation.lat),
      lon: parseFloat(this.selectedLocation.lon),
    };

    this.submitted.emit(result);
  }

  private searchLocation(q: string) {
    const params = new HttpParams()
      .set('q', q)
      .set('format', 'jsonv2')
      .set('addressdetails', '1')
      .set('countrycodes', 'in')
      .set('limit', '8');

    return this.http.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
      params,
      headers: { 'Accept-Language': 'en' } as any,
    });
  }

  private filterLocationResults(list: NominatimResult[]): NominatimResult[] {
    return list.filter((r) => {
      if (r.class === 'place') {
        return ['city', 'town', 'village', 'hamlet', 'suburb', 'neighbourhood'].includes(r.type);
      }
      if (r.class === 'boundary' && r.type === 'administrative') return true;
      return false;
    });
  }
}

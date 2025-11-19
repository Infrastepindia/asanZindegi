import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError } from 'rxjs/operators';
import { BehaviorSubject, of } from 'rxjs';
import { CityService } from './city.service';
import { PhotonService, LocationResult } from '../services/photon.service';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  class: string;
  type: string;
  address?: Record<string, string>;
}

@Component({
  selector: 'az-osm-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="osm-ac-wrap position-relative">
      <input
        class="form-control"
        [placeholder]="placeholder"
        [(ngModel)]="value"
        (input)="onInput($event)"
        (focus)="open = true"
        (blur)="onBlur()"
      />
      <div *ngIf="open && suggestions.length" class="osm-ac-dropdown">
        <button
          type="button"
          class="osm-ac-item w-100 text-start"
          *ngFor="let s of suggestions; let i = index"
          (mousedown)="select(s)"
        >
          <div class="fw-medium">{{ getLabel(s) }}</div>
          <div class="small text-secondary">{{ s.display_name }}</div>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .osm-ac-dropdown {
        position: absolute;
        left: 0;
        right: 0;
        top: 100%;
        background: #fff;
        border: 1px solid #e7e9f3;
        border-top: none;
        z-index: 1040;
        border-radius: 0 0 10px 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }
      .osm-ac-item {
        padding: 8px 12px;
        background: #fff;
        border: 0;
      }
      .osm-ac-item:hover {
        background: #f8f9fb;
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OsmAutocompleteComponent),
      multi: true,
    },
  ],
})
export class OsmAutocompleteComponent implements ControlValueAccessor {
  private http = inject(HttpClient);
  private cityService = inject(CityService);

  @Input() placeholder = 'Enter location';
  @Output() placeSelected = new EventEmitter<{ value: string; full: NominatimResult }>();

  value = '';
  open = false;
  suggestions: NominatimResult[] = [];

  private q$ = new BehaviorSubject<string>('');

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    this.q$.pipe(
      debounceTime(300),
      (mapStr) => mapStr, // dummy to satisfy TS build inlined
    );
    // Build stream manually to avoid build optimizer issue
    this.q$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((q) => q.trim().length > 0),
        switchMap((q) => this.search(q)),
        catchError(() => of([] as NominatimResult[])),
      )
      .subscribe((res) => {
        const filtered = this.filterCityResults(res);
        this.suggestions = filtered.length ? filtered : this.localFallback(this.value);
      });
  }

  // ControlValueAccessor
  writeValue(val: string): void {
    this.value = val || '';
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {}

  onInput(ev: Event) {
    const v = (ev.target as HTMLInputElement).value || '';
    this.value = v;
    this.onChange(this.value);
    this.q$.next(this.value);
  }

  onBlur() {
    setTimeout(() => (this.open = false), 150);
    this.onTouched();
  }

  select(s: NominatimResult) {
    const label = this.getLabel(s);
    this.value = label;
    this.onChange(this.value);
    this.placeSelected.emit({ value: this.value, full: s });
    this.open = false;
  }

  getLabel(s: NominatimResult): string {
    const a = s.address || {};
    const city =
      a['city'] ||
      a['town'] ||
      a['village'] ||
      a['county'] ||
      a['state_district'] ||
      a['state'] ||
      '';
    const suffix = 'India';
    const name = (city as string) || s.display_name;
    return (name as string).includes('India') ? (name as string) : `${name}, ${suffix}`;
  }

  private search(q: string) {
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

  private localFallback(q: string): NominatimResult[] {
    const query = (q || '').toLowerCase().trim();
    if (!query) return [];
    return this.cityService
      .knownCities()
      .map((c) => c.name)
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, 8)
      .map((name) => ({
        display_name: name,
        lat: '',
        lon: '',
        class: 'place',
        type: 'city',
        address: { city: name.replace(', India', ''), state: '', country: 'India' },
      }));
  }

  private filterCityResults(list: NominatimResult[]): NominatimResult[] {
    return list.filter((r) => {
      if (r.class === 'place') {
        return ['city', 'town', 'village', 'hamlet', 'suburb', 'neighbourhood'].includes(r.type);
      }
      if (r.class === 'boundary' && r.type === 'administrative') return true;
      return false;
    });
  }
}

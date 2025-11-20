import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  Inject,
  forwardRef,PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

interface PlaceData {
  address: string;
  lat: number | null;
  lng: number | null;
}

declare global {
  interface Window {
    google: any;
  }
}

@Component({
  selector: 'az-google-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <input
      #inputRef
      type="text"
      class="form-control"
      [placeholder]="placeholder"
      [(ngModel)]="value"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GoogleAutocompleteComponent),
      multi: true,
    },
  ],
})
export class GoogleAutocompleteComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  @Input() placeholder = 'Search location';
  @Output() placeSelected = new EventEmitter<PlaceData>();

  value = '';

  private autocomplete: any;
  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};
  private isBrowser = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser || !this.inputRef) {
      return;
    }

    this.initializeAutocomplete();
  }

  ngOnDestroy(): void {
    if (this.autocomplete && window.google?.maps?.event?.removeListener) {
      window.google.maps.event.clearInstanceListeners(this.autocomplete);
    }
  }

  private initializeAutocomplete(): void {
    if (!window.google?.maps?.places?.Autocomplete || !this.inputRef) {
      return;
    }

    const bias = this.getLocationBias();

    this.autocomplete = new window.google.maps.places.Autocomplete(this.inputRef.nativeElement, {
      fields: ['geometry', 'formatted_address'],
      locationBias: bias || undefined,
    });

    this.autocomplete.addListener('place_changed', () => {
      this.handlePlaceChanged();
    });
  }

  private getLocationBias(): { lat: number; lng: number } | null {
    try {
      const stored = localStorage.getItem('az_city_pref');
      if (stored) {
        const obj = JSON.parse(stored);
        if (obj.lat && obj.lng && !isNaN(obj.lat) && !isNaN(obj.lng)) {
          return { lat: obj.lat, lng: obj.lng };
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    return null;
  }

  private handlePlaceChanged(): void {
    const place = this.autocomplete.getPlace();

    if (!place || !place.geometry) {
      return;
    }

    const data: PlaceData = {
      address: place.formatted_address || '',
      lat: place.geometry && place.geometry.location ? place.geometry.location.lat() : null,
      lng: place.geometry && place.geometry.location ? place.geometry.location.lng() : null,
    };

    this.value = data.address;
    this.onChange(this.value);
    this.placeSelected.emit(data);
  }

  // ControlValueAccessor implementation
  writeValue(val: string): void {
    this.value = val || '';
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {}
}

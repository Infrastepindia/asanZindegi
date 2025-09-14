import { AfterViewInit, Directive, ElementRef, EventEmitter, Output } from '@angular/core';

declare global {
  interface Window {
    google: any;
  }
}

@Directive({
  selector: '[azGooglePlaces]',
  standalone: true,
})
export class GooglePlacesDirective implements AfterViewInit {
  @Output() placeChanged = new EventEmitter<string>();

  private attempts = 0;
  private maxAttempts = 40; // ~20s if 500ms interval
  private intervalId: any;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  ngAfterViewInit(): void {
    this.tryInit();
  }

  private tryInit() {
    if (window.google?.maps?.places?.Autocomplete) {
      const input = this.el.nativeElement;
      const ac = new window.google.maps.places.Autocomplete(input as any, {
        fields: ['formatted_address', 'name', 'geometry'],
        types: ['(cities)'],
        componentRestrictions: { country: ['in'] },
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        const val: string = place?.formatted_address || place?.name || input.value || '';
        if (val) {
          input.value = val;
          this.placeChanged.emit(val);
        }
      });
      return;
    }
    if (this.attempts++ < this.maxAttempts) {
      this.intervalId = setTimeout(() => this.tryInit(), 500);
    }
  }
}

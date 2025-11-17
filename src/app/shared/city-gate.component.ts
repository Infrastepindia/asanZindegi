import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CityService } from './city.service';

@Component({
  selector: 'az-city-gate',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="!hasCity()" class="city-modal-overlay">
      <div class="city-modal">
        <h5 class="mb-3">Choose your city</h5>
        <div class="row g-3">
          <div class="col-6" *ngFor="let c of cities">
            <button type="button" class="city-card w-100 text-start" (click)="choose(c.name)">
              <img [src]="c.img" [alt]="c.name" class="city-thumb" />
              <div class="mt-2 fw-medium">{{ c.name }}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .city-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1200;
        pointer-events: auto;
      }
      .city-modal {
        background: #fff;
        border: 1px solid #e7e9f3;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        padding: 24px;
        max-width: 640px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        pointer-events: auto;
      }
      .city-card {
        background: #fff;
        border: 1px solid #e7e9f3;
        border-radius: 10px;
        padding: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .city-card:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }
      .city-card:active {
        transform: translateY(0);
      }
      .city-thumb {
        width: 100%;
        height: 110px;
        object-fit: cover;
        border-radius: 8px;
      }
    `,
  ],
})
export class CityGateComponent {
  private city = inject(CityService);
  cities = this.city.knownCities();
  hasCity = computed(() => {
    const cityValue = this.city.city();
    console.log('hasCity computed:', { cityValue, result: !!cityValue });
    return !!cityValue;
  });

  choose(name: string) {
    console.log('choose called with:', name);
    this.city.setCity(name);
    console.log('city set, current city:', this.city.city());
  }
}

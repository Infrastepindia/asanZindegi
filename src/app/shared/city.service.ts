import { Injectable, signal } from '@angular/core';

export type CityName =
  | 'Kolkata, India'
  | 'Mumbai, India'
  | 'Hyderabad, India'
  | 'Delhi, India'
  | 'Chennai, India'
  | 'Bengaluru, India'
  | 'Durgapur, India';

export interface Bounds {
  left: number; // min lon
  bottom: number; // min lat
  right: number; // max lon
  top: number; // max lat
}

@Injectable({ providedIn: 'root' })
export class CityService {
  private readonly key = 'az_city_pref';
  readonly citySig = signal<string | null>(null);

  // Approximate bounding boxes for cities
  private readonly boxes: Record<CityName, Bounds> = {
    'Kolkata, India': { left: 88.2, bottom: 22.3, right: 88.6, top: 22.8 },
    'Mumbai, India': { left: 72.75, bottom: 18.88, right: 73.0, top: 19.3 },
    'Hyderabad, India': { left: 78.3, bottom: 17.2, right: 78.7, top: 17.6 },
    'Delhi, India': { left: 76.8, bottom: 28.4, right: 77.4, top: 28.9 },
    'Chennai, India': { left: 80.1, bottom: 12.9, right: 80.35, top: 13.2 },
    'Bengaluru, India': { left: 77.4, bottom: 12.8, right: 77.8, top: 13.2 },
    'Durgapur, India': { left: 87.15, bottom: 23.45, right: 87.38, top: 23.6 },
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(this.key);
      if (saved) this.citySig.set(saved);
    }
  }

  city() {
    return this.citySig();
  }

  setCity(name: CityName | string) {
    console.log('setCity called with:', name);
    this.citySig.set(name);
    console.log('signal set, current value:', this.citySig());
    if (typeof window !== 'undefined') window.localStorage.setItem(this.key, name);
  }

  clearCity() {
    this.citySig.set(null);
    if (typeof window !== 'undefined') window.localStorage.removeItem(this.key);
  }

  getBoundsForCity(name: string | null | undefined): Bounds | null {
    if (!name) return null;
    const k = Object.keys(this.boxes).find((n) => n === name) as CityName | undefined;
    return k ? this.boxes[k] : null;
  }

  knownCities(): Array<{ name: CityName; img: string }> {
    return [
      {
        name: 'Kolkata, India',
        img: 'https://images.unsplash.com/photo-1569416167996-433986d98891?q=80&w=600&auto=format&fit=crop',
      },
      {
        name: 'Mumbai, India',
        img: 'https://images.unsplash.com/photo-1562307532-46792c3a5b22?q=80&w=600&auto=format&fit=crop',
      },
      {
        name: 'Hyderabad, India',
        img: 'https://images.unsplash.com/photo-1609840178322-771ae9c3a3b3?q=80&w=600&auto=format&fit=crop',
      },
      {
        name: 'Delhi, India',
        img: 'https://images.unsplash.com/photo-1606062159139-9a5b5f9d5442?q=80&w=600&auto=format&fit=crop',
      },
      {
        name: 'Chennai, India',
        img: 'https://images.unsplash.com/photo-1608628047959-3212cbb3f2df?q=80&w=600&auto=format&fit=crop',
      },
      {
        name: 'Bengaluru, India',
        img: 'https://images.unsplash.com/photo-1604328698692-f76ea9498f8e?q=80&w=600&auto=format&fit=crop',
      },
      {
        name: 'Durgapur, India',
        img: 'https://images.unsplash.com/photo-1590051034278-5e7c3d5a7933?q=80&w=600&auto=format&fit=crop',
      },
    ];
  }
}

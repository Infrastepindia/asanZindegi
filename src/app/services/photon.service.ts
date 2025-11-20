import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PhotonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    name: string;
    street?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    osm_id?: number;
    osm_key?: string;
    osm_type?: string;
    osm_value?: string;
  };
}

export interface PhotonResponse {
  type: 'FeatureCollection';
  features: PhotonFeature[];
}

export interface LocationResult {
  display_name: string;
  locationName: string;
  lat: string;
  lon: string;
  class: string;
  type: string;
  address?: Record<string, string>;
}

@Injectable({
  providedIn: 'root',
})
export class PhotonService {
  private readonly PHOTON_API = 'https://photon.komoot.io/api';

  constructor(private http: HttpClient) {}

  searchLocation(
    query: string,
    countryCode: string = 'IN',
    limit: number = 8,
    lat?: number,
    lon?: number,
  ): Observable<LocationResult[]> {
    if (!query || !query.trim()) {
      return new Observable((observer) => {
        observer.next([]);
        observer.complete();
      });
    }

    let params = new HttpParams()
      .set('q', query.trim())
      .set('limit', limit.toString())
      .set('lang', 'en');

    if (lat !== undefined && lon !== undefined) {
      params = params.set('lat', lat.toString()).set('lon', lon.toString());
    }

    return this.http.get<PhotonResponse>(`${this.PHOTON_API}/`, { params }).pipe(
      map((response) => {
        return response.features
          .filter((feature) => this.isValidLocation(feature))
          .map((feature) => this.convertToLocationResult(feature));
      }),
    );
  }

  reverseSearch(lat: number, lon: number, limit: number = 1): Observable<LocationResult[]> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('limit', limit.toString());

    return this.http.get<PhotonResponse>(`${this.PHOTON_API}/reverse`, { params }).pipe(
      map((response) => {
        return response.features.map((feature) => this.convertToLocationResult(feature));
      }),
    );
  }

  private isValidLocation(feature: PhotonFeature): boolean {
    const props = feature.properties;
    const osm_value = (props.osm_value || '').toLowerCase();

    const invalidOsmTypes = ['house', 'building', 'way', 'railway', 'landuse'];

    return !invalidOsmTypes.includes(osm_value);
  }

  private convertToLocationResult(feature: PhotonFeature): LocationResult {
    const props = feature.properties;
    const [lon, lat] = feature.geometry.coordinates;

    const display_name = this.buildDisplayName(props);

    return {
      display_name,
      lat: lat.toString(),
      lon: lon.toString(),
      class: props.osm_key || 'place',
      type: props.osm_value || 'location',
      address: {
        street: props.street || '',
        city: props.city || props.town || props.village || '',
        county: props.county || '',
        state: props.state || '',
        country: props.country || '',
        postcode: props.postcode || '',
      },
    };
  }

  private buildDisplayName(props: PhotonFeature['properties']): string {
    const parts: string[] = [];

    if (props.street) parts.push(props.street);
    if (props.city) parts.push(props.city);
    else if (props.town) parts.push(props.town);
    else if (props.village) parts.push(props.village);

    if (props.county) parts.push(props.county);
    if (props.state) parts.push(props.state);
    if (props.country) parts.push(props.country);

    return parts.length > 0 ? parts.join(', ') : props.name || 'Unknown Location';
  }
}

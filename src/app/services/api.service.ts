import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiCategory {
  id: number;
  name: string;
  icon: string;
  count: number;
  superCategoryId: number;
}

export interface ApiSuperCategory {
  id: number;
  title: string;
  colorClass: string;
  icon: string;
  categories: ApiCategory[];
}

export interface ApiListing {
  id: number;
  title: string;
  category: string;
  type: 'Sell' | 'Rent' | 'Exchange' | 'Service' | string;
  location: string;
  price: string | number;
  unit: string;
  cover: string | null;
  date: string;
  views: number;
  rating: number;
  verified: boolean;
  verifiedType?: 'Company' | 'Individual';
}

export interface ApiListingResponse {
  data: {
    page: number;
    perPage: number;
    total: number;
    items: ApiListing[];
  };
  status_code: number;
  status_message: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  private resolveBase(): string {
    let base = environment.base_path || '';
    if (
      typeof window !== 'undefined' &&
      window.location?.protocol === 'https:' &&
      base.startsWith('http://')
    ) {
      base = 'https://' + base.substring('http://'.length);
    }
    return base;
  }

  getCategories(): Observable<{ data: ApiSuperCategory[] }> {
    const url = `${this.resolveBase()}/api/Category`;
    return this.http.get<{ data: ApiSuperCategory[] }>(url);
  }

  getListings(page: number = 1, perPage: number = 10): Observable<ApiListingResponse> {
    const url = `${this.resolveBase()}/api/Listing?page=${page}&perPage=${perPage}`;
    return this.http.get<ApiListingResponse>(url);
  }

  login(payload: { email: string; password: string }): Observable<any> {
    const url = `${this.resolveBase()}/api/User/login`;
    return this.http.post(url, payload);
  }

  forgotPassword(payload: { email: string }): Observable<any> {
    const url = `${this.resolveBase()}/api/User/forgot-password`;
    return this.http.post(url, payload);
  }

  resetPassword(payload: { email: string; token: string; newPassword: string }): Observable<any> {
    const url = `${this.resolveBase()}/api/User/reset-password`;
    return this.http.post(url, payload);
  }

  getCompanyDetails(userId: string | number): Observable<any> {
    const url = `${this.resolveBase()}/api/Provider/getCompanyDetails/${userId}`;
    return this.http.get(url);
  }

  addProviderDetails(
    payload: any,
    files?: {
      profileImage?: File;
      logo?: File;
      registrationCertificates?: File[];
      licenses?: File[];
      portfolio?: File[];
    },
  ): Observable<any> {
    const formData = new FormData();

    // Extract advertisement images from original payload BEFORE JSON serialization
    // (File objects are not JSON-serializable and will be lost during stringify/parse)
    const advertisementImages: File[] = [];
    if (payload.advertisements && Array.isArray(payload.advertisements)) {
      payload.advertisements.forEach((ad: any) => {
        if (ad.images && Array.isArray(ad.images)) {
          ad.images.forEach((img: File) => {
            advertisementImages.push(img);
          });
        }
      });
    }

    // Serialize payload, removing advertisement images (they'll be sent as FormData)
    const payloadForSubmit = JSON.parse(JSON.stringify(payload));
    if (payloadForSubmit.advertisements && Array.isArray(payloadForSubmit.advertisements)) {
      payloadForSubmit.advertisements = payloadForSubmit.advertisements.map((ad: any) => {
        delete ad.images;
        return ad;
      });
    }

    formData.append('providerDetailsPayload', JSON.stringify(payloadForSubmit));
    console.log(JSON.stringify(payloadForSubmit));

    if (files) {
      if (files.profileImage) {
        formData.append('profileImage', files.profileImage);
      }
      if (files.logo) {
        formData.append('logo', files.logo);
      }
      if (files.registrationCertificates && files.registrationCertificates.length > 0) {
        files.registrationCertificates.forEach((f) => {
          formData.append(`registrationCertificates`, f);
        });
      }
      if (files.licenses && files.licenses.length > 0) {
        files.licenses.forEach((f) => {
          formData.append(`licenses`, f);
        });
      }
      if (files.portfolio && files.portfolio.length > 0) {
        files.portfolio.forEach((f) => {
          formData.append(`portfolio`, f);
        });
      }
    }

    // Attach advertisement images to FormData
    if (advertisementImages.length > 0) {
      advertisementImages.forEach((f) => {
        formData.append(`advertisementImages`, f);
      });
    }

    console.log(formData);
    const url = `${this.resolveBase()}/api/Provider/registerProviderWithCompany`;

    return this.http.post(url, formData);
  }

  extractError(err: any): { message: string; status_code?: number; status_message?: string } {
    const body = err?.error ?? err;
    if (body && typeof body === 'object') {
      const message =
        (typeof body.message === 'string' && body.message) ||
        (typeof body.error === 'string' && body.error) ||
        (typeof err?.message === 'string' && err.message) ||
        'Something went wrong';
      const status_code =
        typeof body.status_code === 'number'
          ? body.status_code
          : typeof err?.status === 'number'
            ? err.status
            : undefined;
      const status_message =
        typeof body.status_message === 'string' ? body.status_message : undefined;
      return { message, status_code, status_message };
    }
    if (typeof body === 'string') {
      return { message: body };
    }
    if (typeof err?.message === 'string') {
      return { message: err.message };
    }
    return { message: 'Something went wrong' };
  }
}

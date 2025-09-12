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

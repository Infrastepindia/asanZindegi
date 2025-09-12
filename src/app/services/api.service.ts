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
}

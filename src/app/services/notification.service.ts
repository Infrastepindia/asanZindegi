import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // in ms, 0 for persistent
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  private toastIdCounter = 0;

  getToasts(): Observable<Toast[]> {
    return this.toasts$.asObservable();
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' | 'warning', duration = 4000) {
    const id = `toast-${++this.toastIdCounter}`;
    const toast: Toast = { id, message, type, duration };

    const currentToasts = this.toasts$.value;
    this.toasts$.next([...currentToasts, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  success(message: string, duration = 4000) {
    return this.showToast(message, 'success', duration);
  }

  error(message: string, duration = 5000) {
    return this.showToast(message, 'error', duration);
  }

  info(message: string, duration = 4000) {
    return this.showToast(message, 'info', duration);
  }

  warning(message: string, duration = 4000) {
    return this.showToast(message, 'warning', duration);
  }

  dismiss(id: string) {
    const currentToasts = this.toasts$.value;
    this.toasts$.next(currentToasts.filter((t) => t.id !== id));
  }

  clear() {
    this.toasts$.next([]);
  }
}

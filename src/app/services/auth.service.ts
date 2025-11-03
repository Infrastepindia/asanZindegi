import { Injectable, signal, computed } from '@angular/core';

export interface User {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  [key: string]: any;
  userData:any
}

const USER_STORAGE_KEY = 'az_user';
const USER_ID_STORAGE_KEY = 'az_userId';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSignal = signal<User | null>(this.getStoredUser());
  public user = this.userSignal.asReadonly();
  public isLoggedIn = computed(() => this.userSignal() !== null);

  constructor() {
    this.initializeFromStorage();
  }

  /**
   * Initialize user from localStorage if available
   */
  private initializeFromStorage(): void {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      const storedUser = this.getStoredUser();
      if (storedUser) {
        this.userSignal.set(storedUser);
      }
    }
  }

  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): User | null {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return null;
    }
    try {
      const stored = window.localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Set user data after successful login
   */
  setUser(user: User): void {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      window.localStorage.setItem(USER_ID_STORAGE_KEY, String(user.id));
    }
    this.userSignal.set(user);
  }

  /**
   * Get current logged-in user
   */
  getUser(): User | null {
    return this.userSignal();
  }

  /**
   * Get user ID globally - accessible throughout the application
   */
  getUserId(): string | number | null {
    const user = this.userSignal();
    if (user && user.userData) {
      return user.userData.udId;
    }
    // Fallback to localStorage if signal is not set
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(USER_ID_STORAGE_KEY);
        return stored ? (isNaN(Number(stored)) ? stored : Number(stored)) : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Get user full name
   */
  getUserFullName(): string {
    const user = this.userSignal();
    if (user?.userData) {
      return `${user.userData.firstName} ${user.userData.lastName}`.trim();
    }
    return '';
  }

  /**
   * Logout - clear user data and storage
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      if (typeof window.localStorage !== 'undefined') {
        window.localStorage.clear();
      }
      if (typeof window.sessionStorage !== 'undefined') {
        window.sessionStorage.clear();
      }
    }
    this.userSignal.set(null);
  }

  /**
   * Check if user is logged in
   */
  isAuthenticated(): boolean {
    return this.userSignal() !== null;
  }
}

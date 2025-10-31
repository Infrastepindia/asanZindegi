import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Global UserService - Provides global methods to access user information throughout the application
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private authService = inject(AuthService);

  /**
   * Get the current logged-in user ID globally
   * Can be called from any service or component
   * @returns {string | number | null} The user ID if logged in, null otherwise
   */
  getUserId(): string | number | null {
    return this.authService.getUserId();
  }

  /**
   * Get the current logged-in user's full name
   * @returns {string} User's full name or empty string if not logged in
   */
  getUserFullName(): string {
    return this.authService.getUserFullName();
  }

  /**
   * Get the entire user object
   * @returns {any} The user object or null if not logged in
   */
  getUser(): any {
    return this.authService.getUser();
  }

  /**
   * Check if user is currently logged in
   * @returns {boolean} True if user is logged in, false otherwise
   */
  isUserLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }
}

/**
 * Global utility function to get userId from anywhere in the application
 * This is a direct reference to AuthService.getUserId() for convenience
 * Usage: import { getUserId } from '@app/services/user.service';
 *        const id = getUserId();
 */
export function getUserId(): string | number | null {
  // Note: This uses dependency injection internally via Angular's injector
  const authService = inject(AuthService);
  return authService.getUserId();
}

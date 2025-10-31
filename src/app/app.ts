import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CityGateComponent } from './shared/city-gate.component';
import { AuthService } from './services/auth.service';
import { AccountService } from './services/account.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, CityGateComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('asanZindegi');
  readonly year = new Date().getFullYear();
  protected authService = inject(AuthService);
  private accountService = inject(AccountService);

  isCompanyUser = computed(
    () => this.authService.isLoggedIn() && this.accountService.isCompanyAccount(),
  );

  logout(): void {
    this.authService.logout();
  }
}

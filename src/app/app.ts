import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CityGateComponent } from './shared/city-gate.component';
import { AuthService } from './services/auth.service';

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

  logout(): void {
    this.authService.logout();
  }
}

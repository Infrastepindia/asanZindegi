import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { ListingsComponent } from './pages/listings/listings.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, title: 'AsanZindegi' },
  { path: 'listings', component: ListingsComponent, title: 'Listings' },
  { path: '**', component: NotFoundComponent, title: 'Not Found' }
];

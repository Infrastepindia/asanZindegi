import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { ListingsComponent } from './pages/listings/listings.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { SignupComponent } from './pages/auth/signup/signup.component';
import { ListingDetailsComponent } from './pages/listing-details/listing-details.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, title: 'AsanZindegi' },
  { path: 'listings', component: ListingsComponent, title: 'Listings' },
  { path: 'login', component: LoginComponent, title: 'Login' },
  { path: 'signup', component: SignupComponent, title: 'Sign Up' },
  { path: 'ad/:id', component: ListingDetailsComponent, title: 'Ad Details' },
  { path: '**', component: NotFoundComponent, title: 'Not Found' },
];

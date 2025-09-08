import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { ListingsComponent } from './pages/listings/listings.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { SignupComponent } from './pages/auth/signup/signup.component';
import { ListingDetailsComponent } from './pages/listing-details/listing-details.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ProviderRegisterComponent } from './pages/provider/register/provider-register.component';
import { ProviderDashboardComponent } from './pages/provider/dashboard/provider-dashboard.component';
import { PostAdComponent } from './pages/post-ad/post-ad.component';
import { ProviderProfileComponent } from './pages/provider/profile/provider-profile.component';
import { ProviderAdsComponent } from './pages/provider/ads/provider-ads.component';
import { AdEditComponent } from './pages/ad-edit/ad-edit.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, title: 'AsanZindegi' },
  { path: 'listings/:slug', component: ListingsComponent, title: 'Listings' },
  { path: 'listings', component: ListingsComponent, title: 'Listings' },
  { path: 'login', component: LoginComponent, title: 'Login' },
  { path: 'signup', component: SignupComponent, title: 'Sign Up' },
  { path: 'provider/register', component: ProviderRegisterComponent, title: 'Provider Register' },
  {
    path: 'provider/dashboard',
    component: ProviderDashboardComponent,
    title: 'Provider Dashboard',
  },
  { path: 'provider/profile', component: ProviderProfileComponent, title: 'Provider Profile' },
  { path: 'provider/ads', component: ProviderAdsComponent, title: 'My Ads' },
  { path: 'post-ad', component: PostAdComponent, title: 'Post an Ad' },
  { path: 'ad/:id/edit', component: AdEditComponent, title: 'Edit Ad' },
  {
    path: 'ad/:id',
    component: ListingDetailsComponent,
    title: 'Ad Details',
    data: { renderMode: 'ssr' },
  },
  { path: '**', component: NotFoundComponent, title: 'Not Found' },
];

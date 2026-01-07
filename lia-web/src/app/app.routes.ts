import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./pages/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
    data: { page: 'Auth Callback' }
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard]
  },

  // Rota de níveis descontinuada do fluxo principal
  {
    path: 'practice/:lessonId',
    loadComponent: () => import('./pages/practice.component').then((m) => m.PracticeComponent),
    canActivate: [authGuard],
    data: { page: 'Practice' }
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
    data: { page: 'Profile' }
  },
  { path: '**', redirectTo: 'dashboard' }
];

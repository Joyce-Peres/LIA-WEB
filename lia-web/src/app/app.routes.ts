import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'aprendizado' },
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
    path: 'aprendizado',
    loadComponent: () => import('./pages/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'missoes',
    loadComponent: () => import('./pages/missions.component').then((m) => m.MissionsComponent),
    canActivate: [authGuard],
    data: { page: 'Missões' }
  },

  // Retro-compat: rota antiga
  { path: 'dashboard', pathMatch: 'full', redirectTo: 'aprendizado' },

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
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings.component').then((m) => m.SettingsComponent),
    canActivate: [authGuard],
    data: { page: 'Settings' }
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about.component').then((m) => m.AboutComponent),
    canActivate: [authGuard],
    data: { page: 'About' }
  },
  {
    path: 'help',
    loadComponent: () => import('./pages/help.component').then((m) => m.HelpComponent),
    canActivate: [authGuard],
    data: { page: 'Help' }
  },
  { path: '**', redirectTo: 'aprendizado' }
];

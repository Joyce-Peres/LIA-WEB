import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'login',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'profile',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'settings',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'about',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'help',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'auth/callback',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'practice/**',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];

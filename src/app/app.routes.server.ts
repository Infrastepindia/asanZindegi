import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Server,
  },
  {
    path: 'listings',
    renderMode: RenderMode.Server,
  },
  {
    path: 'listings/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: 'ad/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'ad/:id/edit',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];

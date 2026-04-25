import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/landing-page/landing-page').then(m => m.LandingPage),
  },
  {
    path: 'lobby/:id',
    loadComponent: () =>
      import('./components/lobby/lobby.component').then(m => m.LobbyComponent),
  },
  { path: '**', redirectTo: '' },
];

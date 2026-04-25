import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/lobby/lobby.component').then(m => m.LobbyComponent),
  },
  {
    path: 'host/:sessionId',
    loadComponent: () =>
      import('./components/host/host.component').then(m => m.HostComponent),
  },
  {
    path: 'player/:sessionId',
    loadComponent: () =>
      import('./components/player/player.component').then(m => m.PlayerComponent),
  },
  { path: '**', redirectTo: '' },
];

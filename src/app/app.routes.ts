import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/bienvenida', pathMatch: 'full' },
  { 
    path: 'bienvenida', 
    loadComponent: () => import('./pages/bienvenida/bienvenida').then(m => m.Bienvenida)
  },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  { 
    path: 'registro', 
    loadComponent: () => import('./pages/registro/registro').then(m => m.Registro)
  },
  { 
    path: 'sobre-mi', 
    loadComponent: () => import('./pages/sobre-mi/sobre-mi').then(m => m.SobreMi)
  }
];
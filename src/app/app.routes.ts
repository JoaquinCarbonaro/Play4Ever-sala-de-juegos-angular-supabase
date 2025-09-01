import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { 
    path: 'home', 
    loadComponent: () => import('./pages/bienvenida/bienvenida').then(m => m.Bienvenida)
  },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/registro/registro').then(m => m.Registro)
  },
  { 
    path: 'about-me', 
    loadComponent: () => import('./pages/sobre-mi/sobre-mi').then(m => m.SobreMi)
  },
  { path: '**', redirectTo: '/bienvenida' }
];
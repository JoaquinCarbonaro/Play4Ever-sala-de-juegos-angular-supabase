import type { Routes } from "@angular/router"

export const routes: Routes = [
  //ruta por defecto a bienvenida
  { path: "", redirectTo: "/bienvenida", pathMatch: "full" },

  //ruta bienvenida
  {
    path: "bienvenida",
    loadComponent: () => import("./pages/bienvenida/bienvenida").then((m) => m.Bienvenida),
  },

  //ruta login
  {
    path: "login",
    loadComponent: () => import("./pages/login/login").then((m) => m.Login),
  },

  //ruta registro
  {
    path: "registro",
    loadComponent: () => import("./pages/registro/registro").then((m) => m.Registro),
  },

  //ruta sobre mi
  {
    path: "sobre-mi",
    loadComponent: () => import("./pages/sobre-mi/sobre-mi").then((m) => m.SobreMi),
  },
]

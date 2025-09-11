import { Component, inject } from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import { AsyncPipe  } from '@angular/common'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { Auth } from '../../services/auth'
import { Observable } from 'rxjs'
import { Usuario } from '../../classes/usuario'

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, AsyncPipe , NgbModule], //AsyncPipe para no tener que suscribirme manualmente al observable
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  //guardo el estado del menu (cerrado o abierto)
  isMenuCollapsed = true

  //guardo observable del usuario actual
  usuario$: Observable<Usuario | null>

  //inyecto auth y router
  private readonly auth = inject(Auth)
  private readonly router = inject(Router)

  constructor() {
    //asigno observable de usuario desde auth
    this.usuario$ = this.auth.currentUser$
  }

  //cambia el estado del menu cuando toco el boton
  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed
  }

  //cierra el menu cuando navego a otra pagina
  closeMenu() {
    this.isMenuCollapsed = true
  }

  //cierra sesion y redirige a bienvenida
  logout() {
    this.auth.logout()
    this.closeMenu()
    this.router.navigate(['/bienvenida'])
  }
}

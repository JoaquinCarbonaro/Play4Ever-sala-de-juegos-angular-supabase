import { Component } from "@angular/core"
import { RouterModule } from "@angular/router"
import { NgbModule } from "@ng-bootstrap/ng-bootstrap"

@Component({
  selector: "app-navbar",
  imports: [RouterModule, NgbModule],
  templateUrl: "./navbar.html",
  styleUrl: "./navbar.css",
})
export class Navbar {
  //guarda estado del menu (cerrado o abierto)
  isMenuCollapsed = true

  //abre o cierra el menu cuando toco el boton
  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed
  }

  //metodo para cerrar el menu al cambiar de pagina
  closeMenu() {
    this.isMenuCollapsed = true;
  }
}

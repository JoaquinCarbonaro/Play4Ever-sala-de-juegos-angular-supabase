import { AsyncPipe } from "@angular/common"
import { Component, inject } from "@angular/core"
import { Router, RouterModule } from "@angular/router"
import { Auth } from "../../services/auth"
import type { Observable } from "rxjs"
import type { Usuario } from "../../classes/usuario"

@Component({
  selector: "app-juegos",
  imports: [RouterModule, AsyncPipe],
  templateUrl: "./juegos.html",
  styleUrls: ["./juegos.css"],
})
export class Juegos {
  //lista de juegos con nombre descripcion icono, estado y sprint
  juegos = [
    {
      nombre: "Ahorcado",
      descripcion: "Adivina la palabra oculta antes de que se complete el dibujo",
      icono: "bi-alphabet",
      disponible: true, 
      sprint: 3,
      ruta: "ahorcado",
    },
    {
      nombre: "Mayor o Menor",
      descripcion: "Juego de cartas donde debes adivinar si la siguiente carta es mayor o menor",
      icono: "bi-suit-spade",
      disponible: true,
      sprint: 3,
      ruta: "mayor-menor",
    },
    {
      nombre: "Preguntados",
      descripcion: "Trivia con preguntas de diferentes categorias",
      icono: "bi-question-circle",
      disponible: true,
      sprint: 4,
      ruta: "preguntados",
    },
    {
      nombre: "Connect 4",
      descripcion: "Conecta cuatro fichas en linea para ganar",
      icono: "bi-grid-3x3",
      disponible: true,
      sprint: 4,
      ruta: "connect4",
    },
  ]

  //observable que guarda el estado del usuario
  usuario$: Observable<Usuario | null>

  //inyecto servicio de auth y router
  private readonly auth = inject(Auth)
  private readonly router = inject(Router)

  constructor() {
    //asigno observable de usuario desde auth
    this.usuario$ = this.auth.currentUser$
  }

  //funcion para navegar a la ruta del juego
  jugarJuego(ruta: string) {
    this.router.navigate(["/juegos", ruta])
  }
}

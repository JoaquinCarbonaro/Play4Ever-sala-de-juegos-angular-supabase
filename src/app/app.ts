import { Component, signal } from "@angular/core"
import { RouterOutlet } from "@angular/router"
import { Navbar } from "./components/navbar/navbar"
import { Footer } from "./components/footer/footer"
import { NgbModule } from "@ng-bootstrap/ng-bootstrap"

@Component({
  selector: "app-root",
  imports: [RouterOutlet, Navbar, Footer, NgbModule],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {
  //titulo de la aplicacion
  protected readonly title = signal("Play4Ever")
}

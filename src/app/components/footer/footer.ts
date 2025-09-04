import { CommonModule } from "@angular/common"
import { Component } from "@angular/core"

@Component({
  selector: "app-footer",
  imports: [CommonModule],
  templateUrl: "./footer.html",
  styleUrl: "./footer.css",
})
export class Footer {
  //guardo el año actual
  currentYear = new Date().getFullYear()
}

import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, NgbModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  isMenuCollapsed = true

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed
  }
}

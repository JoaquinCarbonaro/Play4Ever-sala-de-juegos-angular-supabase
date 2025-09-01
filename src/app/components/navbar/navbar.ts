import { Component } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-navbar',
  imports: [NgbModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  isMenuCollapsed = true

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed
  }
}

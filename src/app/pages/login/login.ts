import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { Auth } from '../../services/auth'
import Swal from 'sweetalert2'
import { FormsModule, NgForm } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { NgClass } from '@angular/common' 

@Component({
  selector: 'app-login',
  imports: [RouterModule, FormsModule, NgbModule, NgClass], //ngClass: maneja clases dinamicas (operacion ternaria para el tipo de clase a usar)
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  //guardo el email
  email = ''

  //guardo la contraseña
  password = ''

  //controla si muestro la contraseña
  showPassword = false

  //cambia entre mostrar y ocultar contraseña
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword
  }

  //envio el formulario
  async onSubmit(form?: NgForm) {

    //si el form esta invalido no mando nada
    if (form && form.invalid) {
      return
    }

    //intento loguear con el servicio
    const res = await this.auth.login(this.email, this.password)

    //si no hay error, navego a bienvenida
    if (!res.error) {
      //muestro toast de bienvenida
      Swal.fire({ icon: 'success', title: 'Bienvenido', toast: true, timer: 2000, showConfirmButton: false })
      this.router.navigate(['/bienvenida'])
    }
  }

  //login rapido con datos predefinidos
  loginRapido(email: string, pass: string) {
    //asigno los datos y envio
    this.email = email
    this.password = pass
    this.onSubmit()
  }

  //inyecto servicios por constructor
  constructor(private readonly auth: Auth, private readonly router: Router) {}
}

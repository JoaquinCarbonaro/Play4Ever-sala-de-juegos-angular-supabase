import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import Swal from 'sweetalert2'
import { Usuario } from '../classes/usuario'
import { Supabase } from './supabase'

@Injectable({ providedIn: 'root' })
export class Auth {
  //estado del usuario logueado
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null)
  //observable para la ui (interfaz de usuario)
  public currentUser$ = this.currentUserSubject.asObservable() //convencion = $ => al final a las variables que son observables

  //inyecto supabase ya configurado con environment
  constructor(private readonly sb: Supabase) {}

  //====================================================================

  //login
  async login(email: string, password: string) {
    //hago la peticion de inicio de sesion
    const respuesta = await this.sb.signIn(email, password)

    //si hay error muestro modal basico
    if (respuesta.error) {
      Swal.fire({ title: 'Algo salió mal', icon: 'error', text: 'Revisá los datos' })
      this.currentUserSubject.next(null)
      return { error: respuesta.error }
    }

    //busco el perfil para obtener el nombre -> muestro en navbar
    const perfil = await this.sb.client
      .from('usuarios')
      .select('nombre')
      .eq('id', respuesta.data.user?.id)
      .single()

    //guardo el usuario con nombre si existe
    const nombre = perfil.data?.nombre
    this.currentUserSubject.next({ email, nombre } as Usuario)
    return { data: respuesta.data }
  }

  //====================================================================

  //registro
  async register(userData: {
    email: string
    password: string
    nombre: string
    apellido: string
    edad: number
  }) {
    //mando la info para crear la cuenta
    const respuesta = await this.sb.signUp(userData)

    //si hay error muestro modal simple
    if (respuesta.error) {
      Swal.fire({ title: 'Algo salió mal', icon: 'error', text: 'Revisá los datos' })
      this.currentUserSubject.next(null)
      return { error: respuesta.error }
    }

    //si anda actualizo el usuario con nombre
    this.currentUserSubject.next({ email: userData.email, nombre: userData.nombre } as Usuario)
    return { data: respuesta.data }
  }

  //====================================================================

  //cierre de sesion
  async logout() {
    //cierro sesion en supabase y limpio usuario
    await this.sb.signOut()
    this.currentUserSubject.next(null)
  }

  //====================================================================

  //devuelve usuario actual
  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value
  }

  //====================================================================

  //indica si hay sesion
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null
  }

}

import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import type { Session } from '@supabase/supabase-js'
import Swal from 'sweetalert2'
import { Usuario } from '../classes/usuario'
import { Supabase } from './supabase'
import { Router } from '@angular/router'

@Injectable({ providedIn: 'root' })
export class Auth {

  //estado del usuario logueado
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null)

  //observable para la ui
  public currentUser$ = this.currentUserSubject.asObservable() //convencion $ para observables

  //====================================================================

  //inyecto supabase ya configurado con environment
  constructor(private readonly sb: Supabase, private readonly router: Router) {

    //rehidrato sesion al iniciar servicio
    void this.restoreSession()

    //escucho cambios de sesion para mantener estado en vivo
    this.sb.client.auth.onAuthStateChange((_event, session) => {
      void this.hydrateFromSession(session)
    })
  }

  //====================================================================

  //login
  async login(email: string, password: string) {
    //hago peticion de inicio de sesion
    const respuesta = await this.sb.signIn(email, password)

    //si hay error muestro modal
    if (respuesta.error) {
      await Swal.fire({ title: 'Algo salió mal', icon: 'error', text: 'Revisá los datos' })
      this.currentUserSubject.next(null)
      return { error: respuesta.error }
    }

    //busco el perfil para obtener el nombre usando el uuid de auth
    const userId = respuesta.data.user?.id ?? null
    const perfil = await this.sb.client
      .from('usuarios')
      .select('nombre')
      .eq('id', userId)
      .single()

    //guardo usuario en memoria con id, email y nombre si existe
    const nombre = perfil.data?.nombre ?? null
    this.currentUserSubject.next({ id: userId ?? undefined, email, nombre } as Usuario)

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
    //mando datos para crear la cuenta
    const respuesta = await this.sb.signUp(userData)

    //si hay error muestro modal
    if (respuesta.error) {
      await Swal.fire({ title: 'Algo salió mal', icon: 'error', text: 'Revisá los datos' })
      this.currentUserSubject.next(null)
      return { error: respuesta.error }
    }

    //actualizo estado con id email y nombre
    const id = respuesta.data.user?.id ?? null
    this.currentUserSubject.next({ id: id ?? undefined, email: userData.email, nombre: userData.nombre } as Usuario)

    return { data: respuesta.data }
  }

  //====================================================================

  //cierre de sesion
  async logout() {
    //cierro sesion y limpio estado
    await this.sb.signOut()
    this.currentUserSubject.next(null)

    //redirijo automaticamente al login
    this.router.navigate(['/login'])
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

  //====================================================================

  //rehidrata desde sesion guardada por supabase
  private async restoreSession() {
    try {
      //pido sesion actual
      const { data, error } = await this.sb.client.auth.getSession()

      //si hay error limpio
      if (error) {
        this.currentUserSubject.next(null)
        return
      }

      //si hay sesion hidrato
      await this.hydrateFromSession(data?.session ?? null)

    } catch {
      this.currentUserSubject.next(null) //si falla dejo null
    }
  }

  //====================================================================

  //carga el usuario en memoria a partir de la sesion
  private async hydrateFromSession(session: Session | null) {

    //si no hay usuario limpio estado
    if (!session?.user) {
      this.currentUserSubject.next(null)
      return
    }

    try {
      //traigo nombre desde tabla usuarios usando uuid de auth
      const { data, error } = await this.sb.client
        .from('usuarios')
        .select('nombre')
        .eq('id', session.user.id)
        .single()

      //si falla me quedo con id y email
      if (error) {
        this.currentUserSubject.next({ id: session.user.id, email: session.user.email } as Usuario)
        return
      }

      //si ok guardo id, email y nombre
      const nombre = data?.nombre ?? null
      this.currentUserSubject.next({ id: session.user.id, email: session.user.email, nombre } as Usuario)

    } catch {
      //si rompe me quedo con id y email
      this.currentUserSubject.next({ id: session.user.id, email: session.user.email } as Usuario)
    }
  }

}

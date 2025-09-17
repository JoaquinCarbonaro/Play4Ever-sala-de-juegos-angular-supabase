import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import type { Session } from '@supabase/supabase-js'
import Swal from 'sweetalert2'
import { Usuario } from '../classes/usuario'
import { Supabase } from './supabase'

@Injectable({ providedIn: 'root' })
export class Auth {

  //estado del usuario logueado
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null)

  //observable para la ui (interfaz de usuario)
  public currentUser$ = this.currentUserSubject.asObservable() //convencion = $ => al final a las variables que son observables

  //====================================================================

  //inyecto supabase ya configurado con environment
  constructor(private readonly sb: Supabase) {

    //intento rehidratar la sesion apenas inicia el servicio
    void this.restoreSession()

    //suscribo cambios de sesion para mantener el estado en vivo
    this.sb.client.auth.onAuthStateChange((_event, session) => {

      //actualizo el estado del usuario con la sesion nueva
      void this.hydrateFromSession(session)

    })
  }

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

  //====================================================================

  //rehidrata desde la sesion guardada por supabase
  private async restoreSession() {
    try {

      //pido la sesion actual que guarda supabase
      const { data, error } = await this.sb.client.auth.getSession()

      //si hay error dejo usuario en null
      if (error) {
        this.currentUserSubject.next(null)
        return
      }

      //si viene sesion la uso para armar el usuario en memoria
      await this.hydrateFromSession(data?.session ?? null)

    } catch {
      this.currentUserSubject.next(null) //si falla algo dejo usuario en null
    }
  }

  //====================================================================

  //carga el usuario en memoria a partir de la sesion
  private async hydrateFromSession(session: Session | null) {

    //si no hay usuario en la sesion limpio el estado
    if (!session?.user) {
      this.currentUserSubject.next(null)
      return
    }

    try {

      //traigo el nombre desde la tabla usuarios
      const { data, error } = await this.sb.client
        .from('usuarios')
        .select('nombre')
        .eq('id', session.user.id)
        .single()

      //si la consulta falla me quedo solo con el email
      if (error) {
        this.currentUserSubject.next({ email: session.user.email } as Usuario)
        return
      }

      //si todo ok guardo email y nombre
      const nombre = data?.nombre
      this.currentUserSubject.next({ email: session.user.email, nombre } as Usuario)

    } catch {
      //si la consulta rompe me quedo solo con el email
      this.currentUserSubject.next({ email: session.user.email } as Usuario)
    }
  }

}

import { Injectable } from '@angular/core'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { environment } from '../../environments/environment'

@Injectable({ providedIn: 'root' })
export class Supabase {
  //instancia del cliente de supabase
  private supabase: SupabaseClient

  constructor() {
    //creo el cliente con la url y la key del environment
    this.supabase = createClient(environment.supabaseUrl || "", environment.supabaseKey || "")
  }

  //====================================================================

  //expongo el cliente para que lo usen otros servicios
  get client() {
    return this.supabase
  }

  //====================================================================

  //registro de usuario
  async signUp(data: { email: string; password: string; nombre: string; apellido: string; edad: number }) {
    //crea cuenta con correo y contraseña
    const respuesta = await this.supabase.auth.signUp({ email: data.email, password: data.password })

    //si hay error al crear cuenta lo devuelvo
    if (respuesta.error) {
      return { data: null, error: respuesta.error }
    }

    //guardo datos extra en tabla usuarios
    await this.supabase.from('usuarios').insert({
      id: respuesta.data.user?.id,
      email: data.email,
      nombre: data.nombre,
      apellido: data.apellido,
      edad: data.edad,
    })

    //devuelvo respuesta final
    return { data: respuesta.data, error: null }
  }

  //====================================================================

  //login de usuario
  async signIn(email: string, password: string) {
    //inicio de sesion con correo y contraseña
    return this.supabase.auth.signInWithPassword({ email, password })
  }

  //====================================================================

  //logout de usuario
  async signOut() {
    //cierra la sesion actual
    return this.supabase.auth.signOut()
  }

}

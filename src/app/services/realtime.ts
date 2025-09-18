import { inject, Injectable } from '@angular/core'
import type { RealtimeChannel } from '@supabase/supabase-js'
import Swal from 'sweetalert2'
import { Supabase } from './supabase'
import { Mensaje } from '../interface/mensaje'

@Injectable({ providedIn: 'root' })
export class RealtimeService {

  private readonly supabase = inject(Supabase).client
  private canal: RealtimeChannel | null = null //canal actual o null

  //====================================================================

  async obtenerMensajes(): Promise<Mensaje[]> {

    //traigo mensajes ordenados por fecha asc
    const { data, error } = await this.supabase
      .from('chat')
      .select('*')
      .order('created_at', { ascending: true })

    //control de error
    if (error || !data) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo cargar el chat',
        text: 'Intentá recargar la página en unos segundos.',
        confirmButtonText: 'Entendido',
      })
      return []
    }
    return data as Mensaje[]
  }

  //====================================================================

  //suscripcion a nuevos mensajes
  suscribirse(onMensaje: (mensaje: Mensaje) => void) {

    //si habia un canal previo lo cierro y lo saco del cliente
    if (this.canal) {
      this.supabase.removeChannel(this.canal) //cierra y limpia
      this.canal = null
    }

    //creo un nombre unico para evitar colisiones
    const channelName = `public:chat:${Date.now()}`

    //creo canal nuevo cada vez que entro al chat
    this.canal = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat' },
        payload => onMensaje(payload.new as Mensaje)
      )

    //activo la suscripcion
    this.canal.subscribe(/* status => console.log('estado canal', status) */)
  }

  //====================================================================
  
  async desuscribirse() {
    //si no hay canal no hago nada
    if (!this.canal) return

    //elimino el canal del cliente para que no quede zombi
    await this.supabase.removeChannel(this.canal)
    this.canal = null
  }

  //====================================================================

  async enviarMensaje(texto: string, usuario: string, userId: string) {

    //inserto mensaje con uuid del usuario autenticado
    const { error } = await this.supabase.from('chat').insert({
      mensaje: texto,
      usuario,
      user_id: userId,
    })

    if (error) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar el mensaje',
        text: 'Verificá tu conexión e intentá nuevamente.',
        confirmButtonText: 'Entendido',
      })
      throw error
    }
  }

}

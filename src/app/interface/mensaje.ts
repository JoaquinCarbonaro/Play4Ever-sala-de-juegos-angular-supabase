export interface Mensaje {
  id: string
  user_id: string | null
  usuario: string
  mensaje: string
  created_at: string //iso string que llega desde supabase
}

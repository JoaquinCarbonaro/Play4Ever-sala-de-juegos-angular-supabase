import { Auth } from '../../../../../services/auth'
import { Supabase } from '../../../../../services/supabase'

//========================= SESSION ===========================================
//controla la sesion del juego connect4
//lleva timer global 180s rondas y vidas
//aplica reglas del tp puntaje por victoria bonos de tres en linea penalizaciones
//guarda resultados en tabla connect4_partidas de supabase con usuario activo
//====================================================================

//resultado de ronda
export type Connect4RoundResult = 'win' | 'loss' | 'draw'

//razon de continuidad
export type Connect4SessionStep = 'continue' | 'finishedLives' | 'finishedTime' | 'finishedAll'

//resumen final
export type Connect4FinishReason = 'finishedLives' | 'finishedTime' | 'finishedAll'

//====================================================================

//estado de la sesion para la ui
export interface Connect4SessionSnapshot {
  rounds: number
  lives: number
  score: number
  wins: number
  timeLeft: number
}

//callbacks del timer
export interface Connect4TimerCallbacks {
  onTick?: (timeLeft: number) => void
  onTimeOver?: () => void
}

//====================================================================

//servicio simple para reglas del tp
export class Connect4Session {

  //totales fijos del juego
  readonly totalRounds = 3
  readonly totalLives = 6
  readonly totalTime = 180

  //estado interno de la sesion
  private rounds = 0
  private lives = this.totalLives
  private score = 0
  private wins = 0
  private timeLeft = this.totalTime
  private timerRef: any = null
  private callbacks: Connect4TimerCallbacks | null = null
  private finished = false
  private saved = false

  //====================================================================

  //inyecciones supabase y auth
  constructor(private readonly supabase: Supabase, private readonly auth: Auth) {}

  //====================================================================

  //inicia sesion completa resetea estado y arranca timer
  startSession(callbacks?: Connect4TimerCallbacks) {
    //detengo timer previo por seguridad
    this.stopTimer()
    //guardo callbacks si vienen
    this.callbacks = callbacks ?? null
    //reseteo contadores
    this.rounds = 0
    this.lives = this.totalLives
    this.score = 0
    this.wins = 0
    this.timeLeft = this.totalTime
    this.finished = false
    this.saved = false
    //emito primer tick a la ui
    if (this.callbacks && this.callbacks.onTick) {
      this.callbacks.onTick(this.timeLeft)
    }
    //arranco timer
    this.startTimer()
  }

  //====================================================================

  //aplica bonus por tres en linea
  applyThreeBonus() {
    this.score = this.score + 5
    return this.score
  }

  //====================================================================

  //penalidad si la maquina arma tres en linea
  applyEnemyThreat(): 'ok' | 'no-lives' {
    //resto una vida
    this.lives = this.lives - 1
    //si no quedan vidas cierro sesion
    if (this.lives <= 0) {
      this.lives = 0
      this.finished = true
      this.stopTimer()
      return 'no-lives'
    }
    return 'ok'
  }

  //====================================================================

  //pausa el temporizador global
  pauseTimer() {
    this.stopTimer()
  }

  //====================================================================

  //reanuda el temporizador si sigue activa la sesion
  resumeTimer() {
    if (this.finished || this.timeLeft <= 0) {
      return
    }
    this.startTimer()
  }

  //====================================================================

  //termina ronda aplica reglas y decide proximo paso
  endRound(result: Connect4RoundResult): Connect4SessionStep {
    //si gano sumo puntos victoria y vida con tope
    if (result === 'win') {
      this.score = this.score + 10
      this.wins = this.wins + 1
      this.lives = Math.min(this.lives + 1, this.totalLives)
    }
    //si pierde resto vidas
    if (result === 'loss') {
      this.lives = this.lives - 2
      if (this.lives < 0) {
        this.lives = 0
      }
    }
    //avanzo contador de rondas
    this.rounds = this.rounds + 1

    //chequeo corte por vidas
    if (this.lives <= 0) {
      this.lives = 0
      this.finished = true
      this.stopTimer()
      return 'finishedLives'
    }
    //chequeo corte por tiempo
    if (this.timeLeft <= 0) {
      this.timeLeft = 0
      this.finished = true
      return 'finishedTime'
    }
    //chequeo fin por total de rondas
    if (this.rounds >= this.totalRounds) {
      this.finished = true
      this.stopTimer()
      return 'finishedAll'
    }
    //continua jugando
    return 'continue'
  }

  //====================================================================

  //resumen rapido para la ui
  getSnapshot(): Connect4SessionSnapshot {
    return {
      rounds: this.rounds,
      lives: this.lives,
      score: this.score,
      wins: this.wins,
      timeLeft: this.timeLeft,
    }
  }

  //====================================================================

  //tiempo jugado acumulado
  getElapsedTime() {
    const elapsed = this.totalTime - this.timeLeft
    //evito negativos por seguridad
    return elapsed >= 0 ? elapsed : this.totalTime
  }

  //====================================================================

  //detiene el timer desde fuera por destruccion
  destroy() {
    this.stopTimer()
  }

  //====================================================================

  //guarda partida en supabase y finaliza sesion
  async endSession(reason: Connect4FinishReason) {
    //detengo timer
    this.stopTimer()
    //evito doble guardado
    if (this.saved) {
      return { reason, summary: this.getSnapshot() }
    }
    //marco finalizada y guardada
    this.finished = true
    this.saved = true

    //armo resumen y tiempo jugado
    const summary = this.getSnapshot()
    const elapsed = this.getElapsedTime()

    try {
      //obtengo usuario actual
      const user = this.auth.getCurrentUser()
      //si hay usuario persisto partida
      if (user && user.id) {
        const username = user.nombre ?? user.email ?? 'Jugador'
        await this.supabase.client.from('connect4_partidas').insert({
          user_id: user.id,
          usuario: username,
          tiempo_total: elapsed,
          vidas_restantes: summary.lives,
          aciertos_totales: summary.score,
        })
      } else {
        //no hay sesion activa para guardar
        console.log('no hay usuario activo para guardar connect4')
      }
    } catch (error) {
      //log de error al guardar
      console.log('hubo un problema guardando la partida en supabase', error)
    }

    //devuelvo motivo y resumen
    return { reason, summary }
  }

  //====================================================================

  //stop timer interno
  private stopTimer() {
    //si existe intervalo lo limpio
    if (this.timerRef) {
      clearInterval(this.timerRef)
      this.timerRef = null
    }
  }

  //====================================================================

  //inicia intervalo de un segundo si corresponde
  private startTimer() {
    //si ya hay timer o no hay tiempo restante no hago nada
    if (this.timerRef || this.timeLeft <= 0) {
      //si no hay tiempo informo tick 0 a la ui
      if (this.timeLeft <= 0 && this.callbacks && this.callbacks.onTick) {
        this.callbacks.onTick(this.timeLeft)
      }
      return
    }

    //creo intervalo 1s
    this.timerRef = setInterval(() => {
      //descuento tiempo
      if (this.timeLeft > 0) {
        this.timeLeft = this.timeLeft - 1
      }
      //notifico tick a la ui
      if (this.callbacks && this.callbacks.onTick) {
        this.callbacks.onTick(this.timeLeft)
      }
      //si llego a cero detengo y notifico fin
      if (this.timeLeft <= 0) {
        this.timeLeft = 0
        this.stopTimer()
        this.finished = true
        if (this.callbacks && this.callbacks.onTimeOver) {
          this.callbacks.onTimeOver()
        }
      }
    }, 1000)
  }
  
}

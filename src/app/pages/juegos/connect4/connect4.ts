import { CommonModule } from '@angular/common'
import { Component, OnDestroy, computed, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { MatchPanel } from '../../../components/match-panel/match-panel'
import { Auth } from '../../../services/auth'
import { Supabase } from '../../../services/supabase'
import {
  Connect4Session,
  Connect4FinishReason,
  Connect4SessionStep,
  Connect4Engine,
  getValidColumns,
  pickBotMove,
  Connect4Cell,
  cloneBoard,
  hasExactThree,
  isBoardFull
} from './core';

//========================= COMPONENTE ===========================================
//componente connect4
//orquesta turnos humano/bot y estados de interfaz
//usa connect4engine como motor y pickbotmove como ia basica
//usa connect4session para vidas puntaje tiempo y guardado en supabase
//maneja estado reactivo con signals y computed
//====================================================================

interface Connect4Summary {
  rounds: number
  lives: number
  score: number
  wins: number
  timeLeft: number
}

@Component({
  selector: 'app-connect4',
  imports: [CommonModule, RouterLink, MatchPanel],
  templateUrl: './connect4.html',
  styleUrl: './connect4.css'
})
export class Connect4 implements OnDestroy {

  //estado principal del flujo
  readonly status = signal<'intro' | 'loading' | 'playing' | 'finishedLives' | 'finishedTime' | 'finishedAll'>('intro')
  //motor del juego encapsulando libreria externa
  private readonly engine = new Connect4Engine()

  //tablero en señal para la vista
  readonly board = signal<Connect4Cell[][]>(cloneBoard(this.engine.getBoardSnapshot()))

  //columnas disponibles segun tablero actual
  readonly validColumns = computed(() => getValidColumns(this.board()))

  //textos de la interfaz
  readonly mainMessage = signal('Cuando estes listo, comenzamos la partida.')
  readonly detailMessage = signal('Tenes tres rondas, seis vidas y tres minutos.')

  //control de turnos
  readonly turn = signal<'human' | 'bot'>('human')

  //bandera de operaciones en curso
  readonly processing = signal(false)

  //estadisticas en pantalla
  readonly lives = signal(6)
  readonly score = signal(0) //aciertos acumulados
  readonly wins = signal(0)
  readonly rounds = signal(0)
  readonly timeLeft = signal(180)

  //resumen final para pantallas de cierre
  readonly summary = signal<Connect4Summary>({ rounds: 0, lives: 6, score: 0, wins: 0, timeLeft: 180 })

  //resultado visible debajo del tablero
  readonly roundOutcome = signal<{
    result: 'win' | 'loss' | 'draw'
    title: string
    detail: string
    action: 'next' | 'results'
  } | null>(null)

  //bloqueo de interaccion al terminar una ronda
  readonly roundOver = signal(false)

  //ultima jugada para animacion de caida
  readonly lastMove = signal<{ row: number; column: number; player: Connect4Cell } | null>(null)

  //seguimiento de bonos por tres en linea
  readonly humanThree = signal(false)
  readonly botThree = signal(false)

  //coordenadas de fichas ganadoras para resaltado
  readonly winningCells = signal<{ row: number; column: number }[]>([])

  //totales expuestos a la vista
  readonly totalLives: number
  readonly totalTime: number
  readonly totalRounds: number

  //instancias internas de sesion y control
  private session: Connect4Session
  private pendingStep: Connect4SessionStep | null = null
  private sessionFinished = false
  private animationTimeout: any = null

  //====================================================================

  constructor(private readonly supabase: Supabase, private readonly auth: Auth) {
    //crea sesion y toma constantes globales
    this.session = new Connect4Session(this.supabase, this.auth)
    this.totalLives = this.session.totalLives
    this.totalTime = this.session.totalTime
    this.totalRounds = this.session.totalRounds
    //carga tablero inicial y sincroniza contadores
    this.refreshBoard()
    this.syncSession()
  }

  //====================================================================

  //al destruirse corta el timer y limpia animaciones
  ngOnDestroy() {
    this.session.destroy()
    this.clearLastMove()
  }

  //====================================================================

  //inicia o reinicia la sesion completa
  startSession() {
    if (this.processing()) return
    this.processing.set(true)
    this.status.set('loading')
    this.sessionFinished = false
    this.roundOutcome.set(null)
    this.roundOver.set(false)
    this.clearLastMove()

    //reseteo y arranque de timer con callbacks
    this.pendingStep = null
    this.session.startSession({
      onTick: (time) => this.timeLeft.set(time),
      onTimeOver: () => this.handleTimeOver(),
    })
    //sincroniza ui con sesion y prepara primera ronda
    this.syncSession()
    this.summary.set({ rounds: 0, lives: this.totalLives, score: 0, wins: 0, timeLeft: this.totalTime })
    this.prepareRound()
    this.status.set('playing')
    this.processing.set(false)
  }

  //====================================================================

  //intenta jugar en la columna elegida por el humano
  async playHumanMove(column: number) {
    //valido estado habilitado y columna disponible
    if (this.status() !== 'playing' || this.turn() !== 'human' || this.processing()) return
    if (this.roundOver()) return
    const options = this.validColumns()
    if (!options.includes(column)) return

    //realizo la jugada
    this.processing.set(true)
    try {
      const drop = this.engine.drop(column)
      this.registerLastMove(drop.row, drop.column, 1)
    } catch (error) {
      console.error(error)
      this.processing.set(false)
      return
    }

    //actualizo vista y mensajes
    this.refreshBoard()
    this.mainMessage.set('Ahora mueve el rival.')
    this.detailMessage.set(`Colocaste tu ficha en la columna ${column + 1}.`)

    //evaluo estado post jugada
    const shouldContinue = await this.afterHumanMove()
    if (!shouldContinue) {
      this.processing.set(false)
      return
    }

    //pasa el turno al bot
    this.turn.set('bot')
    this.processing.set(false)
    setTimeout(() => this.playBotMove(), 600)
  }

  //====================================================================

  //accion del bot
  private async playBotMove() {
    if (this.status() !== 'playing' || this.turn() !== 'bot' || this.roundOver()) return
    this.processing.set(true)

    //elige columna con heuristica simple
    const move = pickBotMove(this.board())
    if (move === null || move === undefined) {
      //sin movimientos es empate por tablero lleno
      this.mainMessage.set('El tablero quedo lleno.')
      this.detailMessage.set('La ronda termina en empate.')
      await this.handleRoundEnd('draw')
      this.processing.set(false)
      return
    }

    //realiza jugada del bot
    try {
      const drop = this.engine.drop(move)
      this.registerLastMove(drop.row, drop.column, 2)
    } catch (error) {
      console.error(error)
      this.processing.set(false)
      return
    }

    //actualiza estado y evalua
    this.refreshBoard()
    this.mainMessage.set('Tu turno otra vez.')
    this.detailMessage.set(`El rival eligio la columna ${move + 1}.`)
    const shouldContinue = await this.afterBotMove()
    if (!shouldContinue) {
      this.processing.set(false)
      return
    }

    //vuelve turno al humano
    this.turn.set('human')
    this.processing.set(false)
  }

  //====================================================================

  //evaluaciones posteriores al turno humano
  private async afterHumanMove() {
    //chequeo fin de juego por libreria
    if (this.engine.isGameOver) {
      const winner = this.engine.winner
      if (winner === 'ONE') {
        this.mainMessage.set('¡Ronda ganada!')
        this.detailMessage.set('Conectaste cuatro.')
        await this.handleRoundEnd('win')
        return false
      }
      if (!winner) {
        this.mainMessage.set('Ronda empatada.')
        this.detailMessage.set('El tablero quedó completo.')
        await this.handleRoundEnd('draw')
        return false
      }
      this.mainMessage.set('Ronda para el rival.')
      this.detailMessage.set('Conectó cuatro.')
      await this.handleRoundEnd('loss')
      return false
    }

    //aplico bonus por tres propias si corresponde
    const board = this.board()
    this.handleHumanThree(board)

    //empate por tablero lleno
    if (isBoardFull(board)) {
      this.mainMessage.set('Ronda empatada.')
      this.detailMessage.set('El tablero quedó completo.')
      await this.handleRoundEnd('draw')
      return false
    }
    return true
  }

  //====================================================================

  //evaluaciones posteriores al turno del bot
  private async afterBotMove() {
    //chequeo fin de juego por libreria
    if (this.engine.isGameOver) {
      const winner = this.engine.winner
      if (winner === 'TWO') {
        this.mainMessage.set('Ronda para el rival.')
        this.detailMessage.set('Conectó cuatro.')
        await this.handleRoundEnd('loss')
        return false
      }
      if (!winner) {
        this.mainMessage.set('Ronda empatada.')
        this.detailMessage.set('El tablero quedó completo.')
        await this.handleRoundEnd('draw')
        return false
      }
      this.mainMessage.set('¡Ronda ganada!')
      this.detailMessage.set('Conectaste cuatro.')
      await this.handleRoundEnd('win')
      return false
    }

    //penalidad por tres en linea del bot
    const board = this.board()
    const threat = hasExactThree(board, 2)
    if (threat && !this.botThree()) {
      const response = this.session.applyEnemyThreat()
      this.syncSession()
      this.botThree.set(true)
      this.detailMessage.set('El rival formo tres en linea. Perdiste una vida.')
      if (response === 'no-lives') {
        //sin vidas fin inmediato
        this.roundOutcome.set(null)
        this.roundOver.set(false)
        this.status.set('finishedLives')
        await this.finishSession('finishedLives')
        return false
      }
    }
    if (!threat && this.botThree()) this.botThree.set(false)

    //empate por tablero lleno
    if (isBoardFull(board)) {
      this.mainMessage.set('Ronda empatada.')
      this.detailMessage.set('El tablero quedó completo.')
      await this.handleRoundEnd('draw')
      return false
    }
    return true
  }

  //====================================================================

  //gestiona el bonus del jugador por tres en linea
  private handleHumanThree(board: Connect4Cell[][]) {
    const hasThree = hasExactThree(board, 1)
    if (hasThree && !this.humanThree()) {
      this.session.applyThreeBonus()
      this.syncSession()
      this.humanThree.set(true)
      this.detailMessage.set('Lograste tres fichas consecutivas. Sumaste cinco aciertos.')
    }
    if (!hasThree && this.humanThree()) this.humanThree.set(false)
  }

  //====================================================================

  //prepara tablero y textos para una nueva ronda
  private prepareRound() {
    this.engine.reset()
    this.refreshBoard()
    this.turn.set('human')
    this.humanThree.set(false)
    this.botThree.set(false)
    this.winningCells.set([])
    this.roundOutcome.set(null)
    this.roundOver.set(false)
    this.clearLastMove()
    const snapshot = this.session.getSnapshot()
    const nextRound = snapshot.rounds + 1
    this.mainMessage.set('Es tu turno. Elegi una columna.')
    this.detailMessage.set(`Ronda ${nextRound} de ${this.totalRounds}.`)
  }

  //====================================================================

  //actualiza la señal del tablero y ganadoras
  private refreshBoard() {
    this.board.set(cloneBoard(this.engine.getBoardSnapshot()))
    if (this.engine.isGameOver) {
      const winners = this.engine.winningCells
      this.winningCells.set(winners.length ? winners : [])
    } else {
      this.winningCells.set([])
    }
  }

  //====================================================================

  //sincroniza contadores con la sesion
  private syncSession() {
    const snapshot = this.session.getSnapshot()
    this.lives.set(snapshot.lives)
    this.score.set(snapshot.score)
    this.wins.set(snapshot.wins)
    this.rounds.set(snapshot.rounds)
    this.timeLeft.set(snapshot.timeLeft)
  }

  //====================================================================

  //maneja el cierre de ronda segun resultado
  private async handleRoundEnd(result: 'win' | 'loss' | 'draw') {
    //pauso timer y delego reglas a la sesion
    this.session.pauseTimer()
    const step = this.session.endRound(result)
    this.pendingStep = step
    this.syncSession()
    //reset de flags de tres en linea
    this.humanThree.set(false)
    this.botThree.set(false)
    //muestro resumen de ronda
    this.roundOutcome.set(this.buildRoundOutcome(result, step))
    this.roundOver.set(true)
    //si no continua cierro sesion
    if (step !== 'continue') {
      await this.finishSession(step as Connect4FinishReason)
    }
  }

  //====================================================================

  //cuando el tiempo global llega a cero
  private async handleTimeOver() {
    if (this.sessionFinished) return
    this.status.set('finishedTime')
    this.mainMessage.set('El tiempo global finalizo.')
    this.detailMessage.set('Guardamos tu puntaje en Supabase.')
    this.roundOutcome.set(null)
    this.roundOver.set(false)
    this.pendingStep = null
    await this.finishSession('finishedTime')
  }

  //====================================================================

  //finaliza sesion y persiste datos en supabase
  private async finishSession(reason: Connect4FinishReason) {
    if (this.sessionFinished) return
    this.sessionFinished = true
    const result = await this.session.endSession(reason)
    this.summary.set({
      rounds: result.summary.rounds,
      lives: result.summary.lives,
      score: result.summary.score,
      wins: result.summary.wins,
      timeLeft: result.summary.timeLeft,
    })
    this.syncSession()
  }

  //====================================================================

  //comprueba si una columna esta disponible para click
  canPlayColumn(column: number) {
    if (this.status() !== 'playing' || this.turn() !== 'human' || this.processing() || this.roundOver()) {
      return false
    }
    const options = this.validColumns()
    return options.includes(column)
  }

  //====================================================================

  //clases dinamicas por celda segun estado y ganador
  cellClasses(row: number, column: number, isPlayable: boolean, value: Connect4Cell) {
    const isWinningCell = value !== 0 && this.winningCells().some((cell) => cell.row === row && cell.column === column)
    return {
      'connect4__cell--player': value === 1,
      'connect4__cell--bot': value === 2,
      'connect4__cell--interactive': isPlayable,
      'connect4__cell--blocked': !isPlayable,
      'connect4__cell--winner': isWinningCell,
    }
  }

  //====================================================================

  //clases para la ficha animada
  chipClasses(row: number, column: number, value: Connect4Cell) {
    const animate = this.shouldAnimateChip(row, column, value)
    return { 'connect4__chip--animate': animate }
  }

  //====================================================================

  //variables css usadas para calcular caida
  chipStyles(row: number) {
    return { '--drop-rows': String(row + 1) }
  }

  //====================================================================

  //confirma el resultado mostrado y avanza flujo
  confirmRoundOutcome() {
    if (this.processing()) return
    const step = this.pendingStep
    this.pendingStep = null
    this.roundOutcome.set(null)
    this.roundOver.set(false)

    //si no hay paso pendiente solo reanuda timer
    if (!step) {
      this.session.resumeTimer()
      return
    }

    //si continua prepara nueva ronda
    if (step === 'continue') {
      this.processing.set(true)
      setTimeout(() => {
        this.prepareRound()
        this.session.resumeTimer()
        this.processing.set(false)
      }, 500)
      return
    }

    //si no continua muestra pantalla final segun motivo
    const reason = step as Connect4FinishReason
    this.status.set(reason)
  }

  //====================================================================

  //mensajes segun desenlace de ronda
  private buildRoundOutcome(result: 'win' | 'loss' | 'draw', step: Connect4SessionStep) {
    const action: 'next' | 'results' = step === 'continue' ? 'next' : 'results'
    if (result === 'win') {
      return {
        result,
        action,
        title: '¡Ganaste la ronda!',
        detail: action === 'next'
          ? 'Sumaste 10 aciertos. Si habias perdido alguna recuperaste 1 vida. Preparate para la siguiente partida.'
          : 'Sumaste 10 aciertos. Si habias perdido alguna recuperaste 1 vida. La sesion del juego llego a su fin.'
      }
    }
    if (result === 'loss') {
      return {
        result,
        action,
        title: 'Ronda para el rival.',
        detail: action === 'next'
          ? 'Perdiste 2 vidas en esta ronda. Aun queda juego por delante.'
          : 'Perdiste 2 vidas en esta ronda y se finalizo la sesion del juego.'
      }
    }
    return {
      result,
      action,
      title: 'Ronda empatada.',
      detail: action === 'next'
        ? 'El tablero se completo sin ganador. No hay cambios en tus vidas. Podes seguir jugando.'
        : 'El tablero se completo sin ganador y se finalizo la sesion del juego.'
    }
  }

  //====================================================================

  //determina si corresponde animar una ficha
  private shouldAnimateChip(row: number, column: number, value: Connect4Cell) {
    const last = this.lastMove()
    if (!last || value === 0) return false
    return last.row === row && last.column === column && last.player === value
  }

  //====================================================================

  //registra la ultima jugada para animacion y limpia luego
  private registerLastMove(row: number, column: number, player: Connect4Cell) {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout)
      this.animationTimeout = null
    }
    this.lastMove.set({ row, column, player })
    this.animationTimeout = setTimeout(() => {
      this.lastMove.set(null)
      this.animationTimeout = null
    }, 600)
  }

  //====================================================================

  //limpia animacion pendiente y flag de ultima jugada
  private clearLastMove() {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout)
      this.animationTimeout = null
    }
    this.lastMove.set(null)
  }

}

import { CommonModule } from '@angular/common'
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { MatchPanel } from '../../../components/match-panel/match-panel'
import { Trivia } from '../../../services/trivia'
import { Translation } from '../../../services/translation'
import { Auth } from '../../../services/auth'
import { Supabase } from '../../../services/supabase'
import { TriviaCategoryGroup, TriviaGroupId, TriviaOption, TriviaQuestion } from '../../../interface/open-trivia-database'

@Component({
  selector: 'app-preguntados',
  standalone: true,
  imports: [CommonModule, RouterLink, MatchPanel],
  templateUrl: './preguntados.html',
  styleUrl: './preguntados.css'
})
export class Preguntados implements OnInit, OnDestroy {

  //constantes principales del juego
  readonly totalQuestions = 10
  readonly maxLives = 6
  readonly maxTimeSeconds = 180

  //estado principal del juego
  readonly status = signal<'intro' | 'loading' | 'playing' | 'finishedLives' | 'finishedTime' | 'finishedAll'>('intro')
  //intro = pantalla inicial de configuracion
  //loading = cargando o traduciendo preguntas
  //playing = partida en curso
  //finishedLives = se terminaron las vidas
  //finishedTime = se termino el tiempo
  //finishedAll = se respondieron todas las preguntas

  //opciones de dificultad fijas
  readonly difficultyOptions = [
    { value: 'easy' as const, label: 'Fácil' },
    { value: 'medium' as const, label: 'Media' },
    { value: 'hard' as const, label: 'Difícil' },
  ]

  //listas y selecciones
  readonly groups = signal<TriviaCategoryGroup[]>([]) //lista de grupos permitidos
  readonly groupsLoading = signal(false) //estado de carga de grupos
  readonly groupsError = signal<string | null>(null) //mensaje de error al cargar grupos
  readonly selectedGroup = signal<TriviaGroupId | ''>('') //grupo seleccionado
  readonly selectedDifficulty = signal<'easy' | 'medium' | 'hard' | ''>('') //dificultad seleccionada

  //datos de preguntas
  readonly questions = signal<TriviaQuestion[]>([]) //lista de preguntas
  readonly currentIndex = signal(0) //indice de pregunta actual
  readonly questionText = signal('') //texto traducido de la pregunta
  readonly answerOptions = signal<TriviaOption[]>([]) //opciones preparadas para los botones
  readonly currentCorrectAnswer = signal('') //respuesta correcta original

  //estado de respuestas
  readonly selectedAnswer = signal('') //respuesta elegida
  readonly showAnswer = signal(false) //flag para mostrar correccion
  readonly feedback = signal('') //mensaje principal de feedback
  readonly feedbackDetail = signal('') //detalle de feedback (muestra correcta)
  readonly loadingQuestion = signal(false) //estado de carga de traduccion/pregunta
  readonly gameError = signal<string | null>(null) //errores generales de partida

  //estadisticas de partida
  readonly hits = signal(0) //aciertos
  readonly fails = signal(0) //fallos
  readonly elapsedSeconds = signal(0) //tiempo jugado en segundos
  readonly pendingFinishReason = signal<'time' | 'lives' | null>(null) //motivo pendiente de finalizacion

  //texto dinamico del boton siguiente
  readonly nextButtonLabel = computed(() => {
    if (this.pendingFinishReason()) {
      return 'Ver resultados'
    }
    const total = this.questions().length || this.totalQuestions //total de preguntas cargadas o valor fijo
    const isLastQuestion = this.currentIndex() + 1 >= total //bandera si es la ultima pregunta
    return isLastQuestion ? 'Ver resultados' : 'Siguiente pregunta'
  })

  //computados para vidas restantes
  readonly remainingLives = computed(() => {
    const rest = this.maxLives - this.fails() //calcula vidas restantes
    return rest > 0 ? rest : 0 //nunca retorna negativo
  })

  //computados para tiempo restantes
  readonly remainingTime = computed(() => {
    const rest = this.maxTimeSeconds - this.elapsedSeconds() //calcula segundos restantes
    return rest > 0 ? rest : 0 //nunca retorna negativo
  })

  //referencias internas
  private timerRef: any = null //id del intervalo de tiempo
  private sessionStart: number | null = null //marca de inicio para calcular segundos
  private resultSaved = false //evita guardar resultado mas de una vez

  //====================================================================

  constructor(
    private readonly trivia: Trivia, //servicio de api de preguntas
    private readonly translation: Translation, //servicio de traduccion
    private readonly auth: Auth, //servicio de autenticacion
    private readonly supabase: Supabase, //cliente supabase para guardar resultados
  ) {}

  //====================================================================

  //carga categorias al iniciar
  ngOnInit() {
    //inicio carga de grupos permitidos
    void this.loadGroups()
  }

  //====================================================================

  //limpia temporizador al salir
  ngOnDestroy() {
    //detengo y normalizo el tiempo final
    this.stopTimer()
  }

  //====================================================================

  //trae categorias filtradas
  async loadGroups() {
    this.groupsLoading.set(true)
    this.groupsError.set(null)
    try {
      const data = await this.trivia.getAllowedGroups()
      this.groups.set(data)
      if (data.length === 0) {
        this.groupsError.set('No se encontraron categorías disponibles en la API.')
      }
    } catch (error) {
      console.log('no pude cargar categorias para preguntados', error)
      this.groupsError.set('Ocurrió un error cargando las categorías permitidas.')
    } finally {
      this.groupsLoading.set(false)
    }
  }

  //====================================================================

  //maneja cambio del select de categorias
  onGroupChange(event: Event) {
    const select = event.target as HTMLSelectElement
    const value = select.value as TriviaGroupId
    this.selectedGroup.set(value)
  }

  //====================================================================

  //setea dificultad seleccionada
  chooseDifficulty(value: 'easy' | 'medium' | 'hard') {
    this.selectedDifficulty.set(value)
  }

  //====================================================================

  //comienza una nueva partida
  async startGame() {
    if (this.selectedGroup() === '' || this.selectedDifficulty() === '') {
      return //valida que haya grupo y dificultad
    }
    this.status.set('loading')
    this.gameError.set(null)
    this.stopTimer() //reinicio contador

    //reseteo de estado
    this.questions.set([])
    this.currentIndex.set(0)
    this.hits.set(0)
    this.fails.set(0)
    this.elapsedSeconds.set(0)
    this.selectedAnswer.set('')
    this.showAnswer.set(false)
    this.feedback.set('')
    this.feedbackDetail.set('')
    this.resultSaved = false
    this.pendingFinishReason.set(null)

    try {
      //pido preguntas segun grupo y dificultad
      const questions = await this.trivia.fetchQuestions(
        this.selectedGroup() as TriviaGroupId,
        this.selectedDifficulty() as 'easy' | 'medium' | 'hard',
        this.totalQuestions,
      )
      if (!questions || questions.length === 0) {
        this.gameError.set('No se pudieron cargar preguntas para esta combinación.')
        this.status.set('intro')
        return
      }
      //limito al total fijado y paso a jugar
      this.questions.set(questions.slice(0, this.totalQuestions))
      this.status.set('playing')
      await this.prepareCurrentQuestion() //traduce y arma opciones
      this.startTimer() //arranca tiempo
    } catch (error) {
      console.log('no pude iniciar la partida de preguntados', error)
      this.gameError.set('Ocurrió un problema al iniciar la partida. Intenta nuevamente.')
      this.status.set('intro')
    }
  }

  //====================================================================

  //traduce y prepara la pregunta actual
  async prepareCurrentQuestion() {
    const list = this.questions()
    const index = this.currentIndex()
    const question = list[index]
    if (!question) {
      return //sin pregunta no hago nada
    }
    this.loadingQuestion.set(true)
    this.selectedAnswer.set('')
    this.showAnswer.set(false)
    this.feedback.set('')
    this.feedbackDetail.set('')

    //decodifico campos por si vienen url encoded
    const decodedQuestion = this.decodeField(question.question)
    const decodedCorrect = this.decodeField(question.correct_answer)
    const decodedIncorrect = question.incorrect_answers.map(value => this.decodeField(value))
    const optionsSource = [...decodedIncorrect, decodedCorrect]

    try {
      //traduzco pregunta y opciones
      const translatedQuestion = await this.translateText(decodedQuestion)
      const shuffled = this.shuffleOptions(optionsSource) //desordeno opciones
      const prepared: TriviaOption[] = []
      for (const option of shuffled) {
        const translated = await this.translateText(option)
        prepared.push({ original: option, display: translated || option })
      }
      //seteo estado de ui
      this.questionText.set(translatedQuestion || decodedQuestion)
      this.currentCorrectAnswer.set(decodedCorrect)
      this.answerOptions.set(prepared)
      this.logCorrectAnswer() //debug en consola

    } catch (error) {
      //fallback a texto original si falla traduccion
      console.log('no pude traducir la pregunta actual', error)
      this.questionText.set('No se pudo traducir la pregunta. Mostrando texto original.')
      const prepared: TriviaOption[] = optionsSource.map(item => ({ original: item, display: item }))
      this.answerOptions.set(prepared)
      this.currentCorrectAnswer.set(decodedCorrect)
      this.logCorrectAnswer()
    } finally {
      this.loadingQuestion.set(false)
    }
  }

  //====================================================================

  //maneja la seleccion de una respuesta
  selectAnswer(option: TriviaOption) {
    if (this.status() !== 'playing' || this.loadingQuestion() || this.showAnswer()) {
      return //evito doble click o clicks durante carga
    }
    this.selectedAnswer.set(option.original)
    const correct = this.currentCorrectAnswer()
    const isCorrect = option.original === correct
    const isLastQuestion = this.currentIndex() + 1 >= this.questions().length

    if (isCorrect) {
      this.hits.set(this.hits() + 1)
      this.feedback.set('¡Respuesta correcta!')
    } else {
      this.fails.set(this.fails() + 1)
      this.feedback.set('Respuesta incorrecta.')
      this.feedbackDetail.set(`La respuesta correcta era: ${this.getCorrectAnswerDisplay()}`)
    }
    this.showAnswer.set(true)
    if (isLastQuestion) {
      this.stopTimer()
    }

    if (!isCorrect && this.remainingLives() <= 0) {
      this.handleOutOfLives() //sin vidas termina luego de mostrar la respuesta
    }
  }

  //====================================================================

  //avanza a la siguiente pregunta o termina la partida
  async nextQuestion() {
    if (this.status() !== 'playing' || !this.showAnswer()) {
      return //solo avanza si ya se mostro la correccion
    }
    const pending = this.pendingFinishReason()
    if (pending) {
      this.finishGame(pending)
      return
    }
    const nextIndex = this.currentIndex() + 1
    if (nextIndex >= this.questions().length) {
      this.finishGame('questions')
      return
    }
    this.stopTimer()
    this.currentIndex.set(nextIndex)
    await this.prepareCurrentQuestion()
    this.startTimer()
  }

  //====================================================================

  //reinicia todo y vuelve al menu inicial
  resetGame() {
    this.stopTimer()
    this.status.set('intro')
    this.questions.set([])
    this.currentIndex.set(0)
    this.hits.set(0)
    this.fails.set(0)
    this.elapsedSeconds.set(0)
    this.selectedAnswer.set('')
    this.showAnswer.set(false)
    this.feedback.set('')
    this.feedbackDetail.set('')
    this.gameError.set(null)
    this.resultSaved = false
    this.pendingFinishReason.set(null)
  }

  //====================================================================

  //inicia el temporizador principal
  private startTimer() {
    if (this.timerRef || this.status() !== 'playing' || this.pendingFinishReason()) {
      return //si ya corre no lo duplico
    }
    if (!this.sessionStart) {
      this.sessionStart = Date.now() - this.elapsedSeconds() * 1000 //recalcula si venia andando
    }
    this.timerRef = setInterval(() => {
      if (!this.sessionStart) {
        return
      }
      const seconds = Math.floor((Date.now() - this.sessionStart) / 1000)
      const safeSeconds = Math.min(seconds, this.maxTimeSeconds)
      this.elapsedSeconds.set(safeSeconds)
      if (safeSeconds >= this.maxTimeSeconds) {
        this.handleTimeExpired()
      }
    }, 1000)
  }

  //====================================================================

  //detiene el temporizador
  private stopTimer() {
    if (this.timerRef) {
      clearInterval(this.timerRef)
      this.timerRef = null
    }
    if (this.sessionStart !== null) {
      const seconds = Math.floor((Date.now() - this.sessionStart) / 1000)
      const safeSeconds = Math.min(seconds, this.maxTimeSeconds)
      this.elapsedSeconds.set(safeSeconds)
    }
    this.sessionStart = null
  }

  //====================================================================

  //termina la partida segun el motivo
  private finishGame(reason: 'time' | 'lives' | 'questions') {
    if (this.status() === 'finishedLives' || this.status() === 'finishedTime' || this.status() === 'finishedAll') {
      return //evita finalizar dos veces
    }
    this.stopTimer()
    this.pendingFinishReason.set(null)
    if (reason === 'time') {
      this.status.set('finishedTime')
    } else if (reason === 'lives') {
      this.status.set('finishedLives')
    } else {
      this.status.set('finishedAll')
    }
    void this.saveResult() //guarda resultados
  }

  //====================================================================

  //guarda la partida en supabase
  private async saveResult() {
    if (this.resultSaved) {
      return //evita duplicados
    }
    this.resultSaved = true
    const user = this.auth.getCurrentUser()
    if (!user?.id) {
      console.log('no se guardo la partida porque no hay usuario activo')
      return
    }
    try {
      await this.supabase.client.from('preguntados_partidas').insert({
        user_id: user.id,
        usuario: user.nombre ?? user.email ?? 'Sin nombre',
        tiempo_total: this.elapsedSeconds(),
        vidas_restantes: this.remainingLives(),
        aciertos_totales: this.hits(),
      })
    } catch (error) {
      console.log('hubo un problema guardando la partida de preguntados', error)
    }
  }

  //====================================================================

  //traduce texto usando el servicio o devuelve el original
  private async translateText(text: string) {
    if (!text) {
      return text
    }
    try {
      const translated = await this.translation.translateToSpanish(text)
      return translated || text
    } catch (error) {
      console.log('no pude traducir un texto de preguntados', error)
      return text
    }
  }

  //====================================================================

  //decodifica campos recibidos como url3986
  private decodeField(value: string) {
    try {
      return decodeURIComponent(value)
    } catch (error) {
      console.log('no pude decodificar un campo de trivia', error)
      return value
    }
  }

  //====================================================================

  //desordena opciones para los botones
  private shuffleOptions(options: string[]) {
    const clone = [...options]
    clone.sort(() => Math.random() - 0.5)
    return clone
  }

  //====================================================================

  //obtiene el texto mostrado de la respuesta correcta
  private getCorrectAnswerDisplay() {
    const correct = this.currentCorrectAnswer()
    const match = this.answerOptions().find(item => item.original === correct)
    return match?.display ?? correct
  }

  //====================================================================

  //muestra la respuesta correcta traducida en consola
  private logCorrectAnswer() {
    const display = this.getCorrectAnswerDisplay()
    console.log('respuesta correcta:', display)
  }

  //====================================================================

  //maneja el fin de partida por quedarse sin vidas
  private handleOutOfLives() {
    if (this.pendingFinishReason()) {
      return
    }
    this.pendingFinishReason.set('lives')
    this.stopTimer()
  }

  //====================================================================

  //maneja el fin de partida por tiempo agotado
  private handleTimeExpired() {
    if (this.pendingFinishReason()) {
      return
    }
    this.pendingFinishReason.set('time')
    this.stopTimer()
    if (!this.showAnswer()) {
      this.selectedAnswer.set('')
      this.feedback.set('El tiempo se agotó antes de responder.')
      this.feedbackDetail.set(`La respuesta correcta era: ${this.getCorrectAnswerDisplay()}`)
      this.showAnswer.set(true)
    }
  }

}

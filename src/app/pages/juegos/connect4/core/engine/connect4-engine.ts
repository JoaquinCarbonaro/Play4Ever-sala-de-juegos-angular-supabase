//importa tipos y helpers del juego
import { ConnectFour } from '@devshareacademy/connect-four'
import { CONNECT4_COLUMNS, CONNECT4_ROWS, Connect4Cell } from '../logic/connect4-helpers'

//========================= ENGINE ===========================================
//adaptador simple de la libreria externa @devshareacademy/connect-four
//trabaja con tablero 1d de la libreria y lo mapea a matriz 6x7 para la ui
//expone drop reset snapshot turno ganador celdas ganadoras e historial
//evita acoplar la ui con la libreria directamente
//====================================================================

//tipo de jugador segun libreria
export type Connect4Player = 'ONE' | 'TWO'

//resultado de soltar ficha fila y columna
export interface Connect4DropResult {
  row: number
  column: number
}

//====================================================================

//convierte el tablero 1d de la libreria en una matriz 6x7
function mapBoard(board: number[]): Connect4Cell[][] {
  //acumulador de filas
  const matrix: Connect4Cell[][] = []
  //recorre filas
  for (let row = 0; row < CONNECT4_ROWS; row++) {
    //fila actual
    const currentRow: Connect4Cell[] = []
    //recorre columnas
    for (let column = 0; column < CONNECT4_COLUMNS; column++) {
      //indice lineal dentro del arreglo 1d
      const index = row * CONNECT4_COLUMNS + column
      //agrega celda casteada al tipo del juego
      currentRow.push(board[index] as Connect4Cell)
    }
    //agrega la fila a la matriz final
    matrix.push(currentRow)
  }
  //devuelve la matriz 6x7
  return matrix
}

//====================================================================

export class Connect4Engine {
  //instancia interna de la libreria
  private readonly game = new ConnectFour()

  //coloca una ficha en la columna indicada y devuelve coordenadas
  drop(column: number): Connect4DropResult {
    //la libreria devuelve row y col en coordenada
    const coordinate = this.game.makeMove(column)
    //normaliza a row y column para la app
    return { row: coordinate.row, column: coordinate.col }
  }

  //reinicia el tablero al estado inicial
  reset() {
    this.game.resetGame()
  }

  //obtiene un snapshot del tablero como matriz 6x7
  getBoardSnapshot(): Connect4Cell[][] {
    return mapBoard(this.game.board)
  }

  //devuelve de quien es el turno actual
  get playersTurn(): Connect4Player {
    return this.game.playersTurn
  }

  //indica si la partida ya finalizo
  get isGameOver(): boolean {
    return this.game.isGameOver
  }

  //retorna el ganador si existe
  get winner(): Connect4Player | undefined {
    return this.game.gameWinner
  }

  //coordenadas de las fichas que forman el connect 4
  get winningCells() {
    //mapea de {row col} de la libreria a {row column} de la app
    return this.game.winningCells.map((cell) => ({ row: cell.row, column: cell.col }))
  }

  //historial de movimientos como lista de columnas
  get moveHistory(): number[] {
    //devuelve copia para evitar mutaciones externas
    return [...this.game.moveHistory]
  }

  //devuelve columnas validas segun la fila superior de cada columna
  getValidColumns(): number[] {
    const available: number[] = []
    //si la celda de arriba esta vacia se puede jugar en esa columna
    for (let column = 0; column < CONNECT4_COLUMNS; column++) {
      if (this.game.board[column] === 0) {
        available.push(column)
      }
    }
    return available
  }
}

//====================================================================

//utilidad para la ui cuando solo se tiene la matriz 6x7
export function getValidColumns(board: Connect4Cell[][]) {
  const valid: number[] = []
  //en matriz la fila 0 es la mas alta del tablero
  for (let column = 0; column < CONNECT4_COLUMNS; column++) {
    //si arriba hay 0 la columna acepta mas fichas
    if (board[0][column] === 0) {
      valid.push(column)
    }
  }
  //devuelve columnas disponibles
  return valid
}

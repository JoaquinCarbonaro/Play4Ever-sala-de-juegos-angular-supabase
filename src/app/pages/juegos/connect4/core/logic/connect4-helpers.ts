//========================= HELPERS ===========================================
//funciones puras para tablero 6x7
//crear y clonar tablero validar columnas simular caida de ficha
//detectar ganador con cuatro en linea y casos de tres en linea
//no dependen de la ui ni de supabase
//====================================================================

//definiciones compartidas del juego
export type Connect4Cell = 0 | 1 | 2

//cantidad de filas del tablero
export const CONNECT4_ROWS = 6

//cantidad de columnas del tablero
export const CONNECT4_COLUMNS = 7

//====================================================================

//crea un tablero vacio
export function createEmptyBoard(): Connect4Cell[][] {
  //acumulador de filas
  const board: Connect4Cell[][] = []
  //itero filas
  for (var row = 0; row < CONNECT4_ROWS; row++) {
    //fila actual
    const currentRow: Connect4Cell[] = []
    //itero columnas
    for (var col = 0; col < CONNECT4_COLUMNS; col++) {
      //agrego celda vacia
      currentRow.push(0)
    }
    //agrego fila al tablero
    board.push(currentRow)
  }
  //devuelvo tablero 6x7 vacio
  return board
}

//====================================================================

/*clona el tablero para simulaciones*/
export function cloneBoard(board: Connect4Cell[][]): Connect4Cell[][] {
  //nueva referencia para no mutar el original
  const copy: Connect4Cell[][] = []
  //recorro cada fila y creo copia superficial
  for (var row = 0; row < board.length; row++) {
    copy.push([...board[row]])
  }
  //retorno la copia
  return copy
}

//====================================================================

//verifica si la columna tiene espacio disponible
export function canDrop(board: Connect4Cell[][], column: number) {
  //valido limites de columna
  if (column < 0 || column >= CONNECT4_COLUMNS) {
    return false
  }
  //si la celda superior esta vacia se puede jugar
  return board[0][column] === 0
}

//====================================================================

//simula la caida de una ficha para evaluar jugadas
export function dropPreview(board: Connect4Cell[][], column: number, player: Connect4Cell) {
  //si no se puede jugar en la columna corto
  if (!canDrop(board, column)) {
    return null
  }
  //clono tablero para no modificar el original
  const copy = cloneBoard(board)
  //busco desde abajo hacia arriba la primera celda libre
  for (var row = CONNECT4_ROWS - 1; row >= 0; row--) {
    if (copy[row][column] === 0) {
      //coloco la ficha del jugador en la copia
      copy[row][column] = player
      //retorno el tablero simulado
      return copy
    }
  }
  //si no encontre lugar retorno null
  return null
}

//====================================================================

//chequea si el tablero esta lleno
export function isBoardFull(board: Connect4Cell[][]) {
  //si alguna celda superior esta vacia aun hay espacio
  for (var col = 0; col < CONNECT4_COLUMNS; col++) {
    if (board[0][col] === 0) {
      return false
    }
  }
  //todas las superiores ocupadas tablero lleno
  return true
}

//====================================================================

//busca conectas de cuatro consecutivas
export function hasConnectFour(board: Connect4Cell[][], player: Connect4Cell) {
  //horizontal
  for (var row = 0; row < CONNECT4_ROWS; row++) {
    for (var col = 0; col <= CONNECT4_COLUMNS - 4; col++) {
      if (
        board[row][col] === player &&
        board[row][col + 1] === player &&
        board[row][col + 2] === player &&
        board[row][col + 3] === player
      ) {
        //encontre cuatro seguidas horizontales
        return true
      }
    }
  }
  //vertical
  for (var col = 0; col < CONNECT4_COLUMNS; col++) {
    for (var row = 0; row <= CONNECT4_ROWS - 4; row++) {
      if (
        board[row][col] === player &&
        board[row + 1][col] === player &&
        board[row + 2][col] === player &&
        board[row + 3][col] === player
      ) {
        //encontre cuatro seguidas verticales
        return true
      }
    }
  }
  //diagonal principal
  for (var row = 0; row <= CONNECT4_ROWS - 4; row++) {
    for (var col = 0; col <= CONNECT4_COLUMNS - 4; col++) {
      if (
        board[row][col] === player &&
        board[row + 1][col + 1] === player &&
        board[row + 2][col + 2] === player &&
        board[row + 3][col + 3] === player
      ) {
        //encontre cuatro seguidas en diagonal principal
        return true
      }
    }
  }
  //diagonal inversa
  for (var row = 0; row <= CONNECT4_ROWS - 4; row++) {
    for (var col = 3; col < CONNECT4_COLUMNS; col++) {
      if (
        board[row][col] === player &&
        board[row + 1][col - 1] === player &&
        board[row + 2][col - 2] === player &&
        board[row + 3][col - 3] === player
      ) {
        //encontre cuatro seguidas en diagonal inversa
        return true
      }
    }
  }
  //no hay cuatro en linea
  return false
}

//====================================================================

//chequea si hay exactamente tres en linea sin que exista una cuarta
export function hasExactThree(board: Connect4Cell[][], player: Connect4Cell) {
  //horizontal
  for (var row = 0; row < CONNECT4_ROWS; row++) {
    for (var col = 0; col <= CONNECT4_COLUMNS - 3; col++) {
      if (
        board[row][col] === player &&
        board[row][col + 1] === player &&
        board[row][col + 2] === player
      ) {
        //verifico extremos para asegurar que no sea cuatro
        const left = col - 1 >= 0 ? board[row][col - 1] : -1
        const right = col + 3 < CONNECT4_COLUMNS ? board[row][col + 3] : -1
        if (left !== player && right !== player) {
          return true
        }
      }
    }
  }
  //vertical
  for (var col = 0; col < CONNECT4_COLUMNS; col++) {
    for (var row = 0; row <= CONNECT4_ROWS - 3; row++) {
      if (
        board[row][col] === player &&
        board[row + 1][col] === player &&
        board[row + 2][col] === player
      ) {
        //verifico arriba y abajo para descartar cuatro
        const top = row - 1 >= 0 ? board[row - 1][col] : -1
        const bottom = row + 3 < CONNECT4_ROWS ? board[row + 3][col] : -1
        if (top !== player && bottom !== player) {
          return true
        }
      }
    }
  }
  //diagonal principal
  for (var row = 0; row <= CONNECT4_ROWS - 3; row++) {
    for (var col = 0; col <= CONNECT4_COLUMNS - 3; col++) {
      if (
        board[row][col] === player &&
        board[row + 1][col + 1] === player &&
        board[row + 2][col + 2] === player
      ) {
        //verifico anterior y siguiente de la diagonal
        const prev = row - 1 >= 0 && col - 1 >= 0 ? board[row - 1][col - 1] : -1
        const next = row + 3 < CONNECT4_ROWS && col + 3 < CONNECT4_COLUMNS ? board[row + 3][col + 3] : -1
        if (prev !== player && next !== player) {
          return true
        }
      }
    }
  }
  //diagonal inversa
  for (var row = 0; row <= CONNECT4_ROWS - 3; row++) {
    for (var col = 2; col < CONNECT4_COLUMNS; col++) {
      if (
        board[row][col] === player &&
        board[row + 1][col - 1] === player &&
        board[row + 2][col - 2] === player
      ) {
        //verifico anterior y siguiente de la diagonal inversa
        const prev = row - 1 >= 0 && col + 1 < CONNECT4_COLUMNS ? board[row - 1][col + 1] : -1
        const next = row + 3 < CONNECT4_ROWS && col - 3 >= 0 ? board[row + 3][col - 3] : -1
        if (prev !== player && next !== player) {
          return true
        }
      }
    }
  }
  //no hay exactamente tres en linea
  return false
}

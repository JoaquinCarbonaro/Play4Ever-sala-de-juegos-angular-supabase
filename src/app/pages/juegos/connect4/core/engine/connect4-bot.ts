import { CONNECT4_COLUMNS, Connect4Cell, dropPreview, hasConnectFour } from '../logic/connect4-helpers'

//========================= BOT ===========================================
//ia basica del bot
//elige columna segun heuristicas: ganar ahora, bloquear rival, centro o primer valido
//usa funciones helpers para simular jugadas y detectar cuatro en linea
//====================================================================

//elige la columna para la maquina
export function pickBotMove(board: Connect4Cell[][]) {
  //lista de columnas validas para jugar en este turno
  const options: number[] = []

  //recorro todas las columnas del tablero
  for (var col = 0; col < CONNECT4_COLUMNS; col++) {
    //simulo caer ficha del bot 2 en la columna
    const preview = dropPreview(board, col, 2)

    //si se puede jugar la guardo como opcion
    if (preview) {
      options.push(col)

      //si al jugar ahi hago 4 en linea gano y devuelvo esta columna
      if (hasConnectFour(preview, 2)) {
        return col
      }
    }
  }

  //si no gano ahora busco bloquear al rival
  for (var index = 0; index < options.length; index++) {
    //tomo una columna candidata
    const column = options[index]

    //simulo la jugada del rival 1 en esa columna
    const preview = dropPreview(board, column, 1)

    //si el rival haria 4 en linea bloqueo devolviendo esa columna
    if (preview && hasConnectFour(preview, 1)) {
      return column
    }
  }

  //prefiero la columna central si esta disponible
  const center = Math.floor(CONNECT4_COLUMNS / 2)
  if (options.includes(center)) {
    return center
  }

  //como ultimo recurso uso la primera opcion disponible o null si no hay jugadas
  return options.length > 0 ? options[0] : null
}

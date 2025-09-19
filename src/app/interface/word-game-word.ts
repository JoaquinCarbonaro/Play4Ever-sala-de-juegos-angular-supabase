//interface de palabra para la api del ahorcado
export interface WordGameWord {
  _id: string //id interno
  word: string //palabra original en ingles
  category: string //categoria de la palabra
  numLetters: number //cantidad de letras
  numSyllables: number //cantidad de silabas
  hint?: string //pista opcional
}

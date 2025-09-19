import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class Translation {

  //url base de la api translate
  private readonly translateBaseUrl = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q='

  //====================================================================

  //inyecto httpclient
  constructor(private readonly http: HttpClient) {}

  //====================================================================

  //traduce texto al español
  async translateToSpanish(text: string) {

    //armo url encodeada con el texto -> URL encodeada = texto convertido a un formato seguro para incluir dentro de una URL
    const url = `${this.translateBaseUrl}${encodeURIComponent(text)}`

    //hago peticion a la api
    const data = await firstValueFrom(this.http.get<any>(url))

    //extraigo traduccion o devuelvo texto original
    const translated = Array.isArray(data) && Array.isArray(data[0]) && Array.isArray(data[0][0])
      ? data[0][0][0]
      : text

    //retorno siempre como string
    return String(translated)
  }

}

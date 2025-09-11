import { type ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from "@angular/core"
import { provideRouter } from "@angular/router"
import { provideHttpClient } from "@angular/common/http"
import { routes } from "./app.routes"

//configuracion principal de la aplicacion
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    //zoneless
    provideZonelessChangeDetection(),
    //provee el router con las rutas definidas
    provideRouter(routes),
    //provee httpclient para peticiones a apis
    provideHttpClient(),
  ],
}

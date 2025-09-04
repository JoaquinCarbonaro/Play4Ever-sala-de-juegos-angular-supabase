/// <reference types="@angular/localize" />

import { bootstrapApplication } from "@angular/platform-browser"
import { appConfig } from "./app/app.config"
import { App } from "./app/app"

//inicio la aplicacion con la configuracion principal
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

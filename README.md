# Play4Ever — Sala de Juegos

Aplicación web tipo **sala de juegos** desarrollada con **Angular, TypeScript y Supabase**.

Este proyecto fue realizado como **Trabajo Práctico N.º 1 de la materia Programación IV**. El objetivo es que los usuarios puedan registrarse, iniciar sesión, jugar distintos minijuegos y consultar estadísticas/rankings para medir su desempeño.

---

## 🚀 Demo

La aplicación fue desplegada originalmente en Vercel, pero actualmente la demo puede no estar completamente funcional porque requiere servicios externos activos.

Repositorio público:

https://github.com/JoaquinCarbonaro/Play4Ever-sala-de-juegos-angular-supabase

---

## 🎮 Funcionalidades principales

### 🔐 Autenticación

- Registro e inicio de sesión con email y contraseña mediante Supabase Auth.
- Guardado de datos adicionales del perfil de usuario, como nombre, apellido y edad.
- Persistencia de sesión con `sessionStorage`.
- Control de acceso para usuarios logueados.

### 🕹️ Juegos incluidos

#### Ahorcado

- Juego clásico de adivinanza de palabras.
- Ingreso de letras mediante botones.
- Registro de métricas como tiempo y letras seleccionadas.

#### Mayor o Menor

- Juego de cartas donde el usuario predice si la próxima carta será mayor o menor.
- Registro de desempeño por partida.

#### Preguntados

- Preguntas consumidas desde una API externa.
- Respuestas mediante botones.
- Guardado de resultados.

#### Play4Ever Connect 4

Juego propio basado en **Conecta 4**, implementado con separación clara de responsabilidades.

Incluye:

- Sistema de rondas.
- Puntaje.
- Vidas.
- Bonos por jugadas especiales.
- Penalizaciones.
- Temporizador global.
- Bot con lógica básica de decisión.

---

## 💬 Chat global en tiempo real

- Sala única de chat para usuarios logueados.
- Mensajes guardados en Supabase.
- Actualización en tiempo real mediante Supabase Realtime.
- Visualización de usuario y fecha de cada mensaje.

---

## 🏆 Resultados y rankings

- Pantalla de resultados por juego.
- Rankings ordenados según desempeño.
- Registro de partidas y métricas asociadas.

---

## 🙋‍♂️ Página “Quién soy”

- Presentación del autor.
- Explicación del juego propio.
- Consumo de la API de GitHub para mostrar datos del perfil.

---

## 🧰 Tecnologías usadas

- Angular
- TypeScript
- HTML
- CSS
- Supabase Auth
- Supabase Database
- Supabase Realtime
- Bootstrap
- ng-bootstrap
- SweetAlert2
- API externa para preguntas
- API de GitHub

---

## 🗃️ Persistencia de datos

El proyecto guarda información en Supabase para:

- Usuarios.
- Chat global.
- Resultados de Ahorcado.
- Resultados de Mayor o Menor.
- Resultados de Preguntados.
- Resultados de Connect 4.

---

## 🧩 Arquitectura destacada: Connect 4

El juego propio fue desarrollado con una estructura modular para mantener el código organizado y fácil de mantener.

Estructura principal:

- `connect4.ts` / `connect4.html`: UI y orquestación del juego.
- `core/engine.ts`: adaptación de la lógica del tablero.
- `core/bot.ts`: lógica del bot.
- `core/session.ts`: reglas de sesión, puntaje, vidas, timer y guardado.
- `core/logic/connect4-helpers.ts`: funciones auxiliares y validaciones.

---

## ✅ Contexto académico

Este proyecto fue desarrollado como parte de **Programación IV**.

El trabajo se organizó por etapas e incluye:

- Autenticación.
- Manejo de sesión.
- Juegos con condiciones claras de victoria y derrota.
- Chat en tiempo real.
- Persistencia de datos.
- Consumo de APIs.
- Rankings y resultados.
- Interfaz visual cuidada.

---

## 💡 Lo que demuestra este proyecto

- Desarrollo frontend con Angular y TypeScript.
- Integración con Supabase Auth, Database y Realtime.
- Manejo de autenticación y rutas protegidas.
- Persistencia de datos por dominio.
- Implementación de juegos con lógica propia.
- Consumo de APIs externas.
- Organización modular del código.
- Uso de componentes visuales y modales.
- Diseño de una experiencia interactiva para usuarios.

---

## 👤 Autor

**Joaquín Carbonaro**

GitHub: https://github.com/JoaquinCarbonaro  
LinkedIn: https://www.linkedin.com/in/joaquin-carbonaro

# TP #1 — Sala de Juegos (Programación IV)

Aplicación web tipo **“Sala de Juegos”** desarrollada como trabajo práctico de **Programación IV**.  
El objetivo es que los usuarios puedan **registrarse / iniciar sesión**, jugar distintos minijuegos y consultar **estadísticas y rankings** para medir desempeño (tiempo, aciertos, puntaje, etc.).

## 🚀 Demo (Deploy)
- Vercel: https://joaquin-carbonaro-tp-1-prog-4-2025.vercel.app

---

## 🎮 Funcionalidades principales

### 🔐 Autenticación (con persistencia de sesión)
- **Registro e inicio de sesión** con email y contraseña (Supabase Auth).
- En el registro también se guardan **datos adicionales** del perfil (nombre, apellido, edad) en una tabla propia.
- La sesión se conserva con **sessionStorage**: si recargás la página en la misma pestaña seguís logueado, pero si cerrás la pestaña o el navegador, la sesión se pierde (decisión intencional para el TP).

### 🕹️ Juegos incluidos
- **Ahorcado**: ingreso por botones (sin teclado), registra métricas como tiempo y letras seleccionadas.
- **Mayor o Menor**: el usuario predice si la próxima carta será mayor o menor, y se guarda el rendimiento.
- **Preguntados**: preguntas consumidas desde una **API externa**, respuestas por botones y guardado de resultados.
- **Juego propio: Connect 4 (Conecta 4)**
  - Implementado como módulo con separación clara de responsabilidades (UI, motor, bot, sesión y helpers).
  - Reglas de sesión: **3 rondas**, sistema de **puntaje**, **vidas**, **bonos** por “tres en línea”, penalizaciones y **tiempo global** (3 minutos).

### 💬 Chat global en tiempo real
- Una única sala para usuarios logueados.
- Mensajes guardados en base de datos y actualizados **en tiempo real** (sin recargar la página).

### 🏆 Resultados y rankings
- Pantalla de **Resultados** con **4 tablas** (una por juego), ordenadas de mejor a peor desempeño.

### 🙋‍♂️ Página “Quién soy”
- Presentación del alumno y explicación del juego propio.
- Consumo de la **API de GitHub** para mostrar datos del perfil.

---

## 🧰 Tecnologías usadas
- **Angular + TypeScript** (frontend)
- **Supabase** (Auth + Base de datos + Realtime)
- **Bootstrap / ng-bootstrap** para estilos y componentes visuales
- **SweetAlert2** para modales (no se usa `alert()`)
- Librería de Connect 4: `@devshareacademy/connect-four` (adaptada mediante un engine propio)

---

## 🗃️ Persistencia (modelo de datos)
El proyecto guarda información en Supabase para:
- `usuarios` (perfil adicional al Auth)
- `chat` (mensajes con usuario y fecha)
- `ahorcado_partidas`, `mayor_menor_partidas`, `preguntados_partidas`, `connect4_partidas` (resultados por juego)

---

## 🧩 Arquitectura destacada: Connect 4
El “juego propio” se implementó con una estructura modular para mantener el código claro:

- `connect4.ts / connect4.html`: UI y orquestación (turnos, estados, animaciones)
- `core/engine.ts`: adaptador de la librería externa a un tablero 2D
- `core/bot.ts`: IA simple (ganar / bloquear / priorizar centro / primera válida)
- `core/session.ts`: reglas del TP (vidas, puntaje, timer global) + guardado en DB
- `core/logic/connect4-helpers.ts`: funciones puras del tablero (validaciones, detección de líneas, previews)

---

## ✅ Contexto del TP
El trabajo se organizó por sprints e incluye: autenticación, juegos con condiciones claras de victoria/derrota, chat en tiempo real, una experiencia de usuario cuidada y listados de resultados.

---

## 💡 Lo que demuestra este proyecto
- **Autenticación y control de acceso**: registro/login, rutas protegidas y manejo de sesión.
- **Persistencia y modelado de datos**: guardado de usuarios, partidas y chat con tablas separadas por dominio.
- **Tiempo real (Realtime)**: chat global con actualización automática sin refrescar.
- **Consumo de APIs**: integración de API externa (Preguntados) y API de GitHub (perfil).
- **Arquitectura modular en frontend**: separación por responsabilidades (componentes/servicios/lógica), especialmente en Connect 4.
- **UI/UX consistente**: uso de componentes visuales y modales para una interacción más clara.

---

## 👤 Autor
- Joaquín Carbonaro

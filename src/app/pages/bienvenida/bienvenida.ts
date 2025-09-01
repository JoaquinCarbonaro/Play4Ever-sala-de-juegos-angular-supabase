import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-bienvenida',
  imports: [RouterModule, CommonModule],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.css',
})
export class Bienvenida {
  juegos = [
    {
      nombre: 'Ahorcado',
      descripcion: 'Adivina la palabra oculta antes de que se complete el dibujo',
      icono: 'bi-alphabet',
      disponible: false,
      sprint: 3,
    },
    {
      nombre: 'Mayor o Menor',
      descripcion: 'Juego de cartas donde debes adivinar si la siguiente carta es mayor o menor',
      icono: 'bi-suit-spade',
      disponible: false,
      sprint: 3,
    },
    {
      nombre: 'Preguntados',
      descripcion: 'Trivia con preguntas de diferentes categorías',
      icono: 'bi-question-circle',
      disponible: false,
      sprint: 4,
    },
    {
      nombre: 'Connect 4',
      descripcion: 'Conecta cuatro fichas en línea para ganar',
      icono: 'bi-grid-3x3',
      disponible: false,
      sprint: 4,
    },
  ];
}

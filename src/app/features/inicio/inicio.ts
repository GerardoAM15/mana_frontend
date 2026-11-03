import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { hoy } from '../../core/utils/fechas';

@Component({
  selector: 'app-inicio',
  imports: [DatePipe],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  protected readonly fecha = hoy();
}

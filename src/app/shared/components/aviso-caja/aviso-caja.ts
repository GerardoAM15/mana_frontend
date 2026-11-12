import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CajaEstadoService } from '../../../core/services/caja-estado.service';

// Aviso "Abra su caja para continuar" para las pantallas que cobran.
// La pantalla que lo usa deshabilita su botón de guardar con cajaEstado.abierta().
@Component({
  selector: 'app-aviso-caja',
  imports: [RouterLink],
  templateUrl: './aviso-caja.html',
  styleUrl: './aviso-caja.css',
})
export class AvisoCaja implements OnInit {
  protected readonly cajaEstado = inject(CajaEstadoService);

  ngOnInit(): void {
    if (!this.cajaEstado.cargada()) this.cajaEstado.refrescar().subscribe({ error: () => undefined });
  }
}

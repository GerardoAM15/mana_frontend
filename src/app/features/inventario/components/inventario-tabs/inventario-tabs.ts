import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

// Pestañas comunes de las pantallas de Inventario.
@Component({
  selector: 'app-inventario-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './inventario-tabs.html',
  styleUrl: './inventario-tabs.css',
})
export class InventarioTabs {}

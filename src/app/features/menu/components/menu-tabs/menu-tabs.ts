import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

// Pestañas comunes de las pantallas del módulo Menú.
@Component({
  selector: 'app-menu-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-tabs.html',
  styleUrl: './menu-tabs.css',
})
export class MenuTabs {}

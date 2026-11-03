import { Component, inject, OnInit } from '@angular/core';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { MenuTabs } from '../../components/menu-tabs/menu-tabs';
import { PreciosSueltos } from '../../components/precios-sueltos/precios-sueltos';
import { ReglasCobro } from '../../components/reglas-cobro/reglas-cobro';
import { Tarifas } from '../../components/tarifas/tarifas';

// Tarifas de pensionista, menús públicos (reglas de cobro) y precios sueltos.
@Component({
  selector: 'app-precios',
  imports: [MenuTabs, Tarifas, ReglasCobro, PreciosSueltos],
  templateUrl: './precios.html',
  styleUrl: './precios.css',
})
export class Precios implements OnInit {
  private readonly catalogos = inject(CatalogoService);

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
  }
}

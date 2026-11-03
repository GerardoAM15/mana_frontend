import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { MENU } from '../../core/config/menu';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly auth = inject(AuthService);

  // computed sobre el signal de la sesión: al cambiar de usuario el menú se recalcula sin recargar.
  protected readonly menu = computed(() => MENU.filter(item => this.auth.tienePermiso(item.permiso)));
}

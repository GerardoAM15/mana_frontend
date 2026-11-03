import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

// Uso: <button *siPermiso="'VENTA_ANULAR'">Anular</button>
// Muestra el elemento solo si el usuario tiene el permiso; se actualiza solo al cambiar la sesión.
@Directive({ selector: '[siPermiso]' })
export class SiPermiso {
  readonly siPermiso = input.required<string>();

  private readonly auth = inject(AuthService);
  private readonly plantilla = inject(TemplateRef<unknown>);
  private readonly contenedor = inject(ViewContainerRef);
  private visible = false;

  constructor() {
    effect(() => {
      const permitido = this.auth.tienePermiso(this.siPermiso());
      if (permitido && !this.visible) this.contenedor.createEmbeddedView(this.plantilla);
      if (!permitido && this.visible) this.contenedor.clear();
      this.visible = permitido;
    });
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ConsultaDocumentoService, mensajeConsulta } from '../services/consulta-documento.service';

// Autocompleta nombre y apellido a partir del DNI (RENIEC vía backend).
// Crear como inicializador de campo del componente (necesita contexto de inyección).
// Al registrar busca solo al llegar a 8 dígitos; al editar, solo con el botón.
// Nunca bloquea: si la consulta falla, el usuario escribe los datos.
export class AutocompletadoDni {
  readonly buscando = signal(false);
  readonly aviso = signal<string | null>(null);
  private ultimo = '';

  constructor(
    private readonly consultas: ConsultaDocumentoService,
    private readonly controles: { dni: FormControl<string>; nombre: FormControl<string>; apellido: FormControl<string> },
    private readonly esEdicion: () => boolean,
  ) {
    controles.dni.valueChanges.pipe(takeUntilDestroyed()).subscribe(dni => {
      if (!this.esEdicion() && /^\d{8}$/.test(dni) && dni !== this.ultimo) this.buscar();
    });
  }

  buscar(): void {
    const dni = this.controles.dni.value.trim();
    if (!/^\d{8}$/.test(dni)) {
      this.controles.dni.markAsTouched();
      return;
    }
    this.ultimo = dni;
    this.buscando.set(true);
    this.aviso.set(null);
    this.consultas.dni(dni).subscribe({
      next: r => {
        this.buscando.set(false);
        if (r.registrado && !this.esEdicion()) {
          this.aviso.set(`Ya existe una persona registrada con este DNI: ${r.nombre} ${r.apellido}.`);
          return;
        }
        this.controles.nombre.setValue(r.nombre);
        this.controles.apellido.setValue(r.apellido);
        this.aviso.set(r.fuente === 'RENIEC' ? 'Datos completados desde RENIEC; revíselos antes de guardar.' : null);
      },
      error: (err: HttpErrorResponse) => {
        this.buscando.set(false);
        this.aviso.set(mensajeConsulta(err));
      },
    });
  }
}

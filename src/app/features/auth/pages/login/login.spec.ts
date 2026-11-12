import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { Login } from './login';

describe('Login', () => {
  async function ingresarConError(status: number, message: string | null) {
    const login = vi.fn(() =>
      throwError(() => new HttpErrorResponse({ status, statusText: 'Error', error: message ? { status, message } : null })),
    );
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AuthService, useValue: { login } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();

    const elemento: HTMLElement = fixture.nativeElement;
    const escribir = (selector: string, valor: string) => {
      const input = elemento.querySelector(selector) as HTMLInputElement;
      input.value = valor;
      input.dispatchEvent(new Event('input'));
    };
    escribir('#correo', 'cajero@mana.pe');
    escribir('#clave', 'otra-clave');
    (elemento.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    return { elemento, login };
  }

  it('con 429 muestra el mensaje del backend, no "Credenciales inválidas"', async () => {
    const mensaje = 'Demasiados intentos de inicio de sesión. Intente de nuevo en 5 minutos.';
    const { elemento, login } = await ingresarConError(429, mensaje);
    expect(login).toHaveBeenCalledWith({ correo: 'cajero@mana.pe', clave: 'otra-clave' });
    const alerta = elemento.querySelector('.alerta')?.textContent?.trim();
    expect(alerta).toBe(mensaje);
    expect(alerta).not.toContain('Credenciales');
    // El botón vuelve a habilitarse para reintentar más tarde.
    expect((elemento.querySelector('button[type=submit]') as HTMLButtonElement).disabled).toBe(false);
  });

  it('con 429 sin cuerpo muestra el estado, no un texto inventado', async () => {
    const { elemento } = await ingresarConError(429, null);
    expect(elemento.querySelector('.alerta')?.textContent?.trim()).toBe('Error 429: Error');
  });
});

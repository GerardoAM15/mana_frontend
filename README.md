# MANÁ · Frontend

Frontend en Angular 22 del sistema MANÁ (comedor universitario: pensiones prepago, punto de venta, caja, menú, inventario y reportes).

> Este README se completa en la fase 8 (instalación detallada, mapa de pantallas por rol y capturas).

## Ejecutar en desarrollo

1. Levante el backend MANÁ en `http://localhost:8080`.
2. Instale las dependencias y arranque el frontend:

   ```bash
   npm install
   npx ng serve
   ```

3. Abra `http://localhost:4200/`. Las peticiones a `/api` pasan por `proxy.conf.json` hacia el puerto 8080.

> Use el puerto 4200: el CORS del backend solo admite `http://localhost:4200`.

## Usuarios de prueba (solo para desarrollo)

> **Solo para desarrollo.** Estas credenciales son de la base de datos local; no las use en producción.

| Rol | Correo | Contraseña | Local |
|---|---|---|---|
| ADMINISTRADOR | `admin@mana.pe` | `Admin12345` | Local principal |
| DUENO | `dueno@mana.pe` | `Dueno12345` | Local principal |
| CAJERO | `cajero@mana.pe` | `Cajero12345` | Local principal |

El administrador lo crea el backend al arrancar. El dueño y el cajero se crearon con `POST /api/v1/usuarios` usando el token del administrador.

## Compilar

```bash
npx ng build
```

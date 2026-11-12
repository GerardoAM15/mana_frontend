# MANÁ · Frontend

Frontend en **Angular 22** del sistema MANÁ (comedor universitario): pensiones prepago, mostrador de pensionistas, punto de venta, caja, menú, inventario, gastos y reportes.

- Componentes standalone, signals, control flow (`@if`, `@for`), Reactive Forms y lazy loading.
- Sin librerías de UI ni de gráficos: estilos y barras con CSS propio (paleta MANÁ en `src/styles.css`).
- Arquitectura de `referencia/pharmafrontend`; autenticación de `referencia/examen_frontend`.
- Contrato del backend: `docs/openapi.json` y `docs/ENDPOINTS.md`.

## Equipo y módulos

Proyecto desarrollado en conjunto por los cinco integrantes, trabajando en un mismo equipo de cómputo.
Para que el historial refleje la responsabilidad de cada uno, el código se organizó en commits por módulo:
cada commit tiene como autor al responsable del módulo y como coautores al resto del equipo.

| Integrante | Módulo | Casos de uso |
|---|---|---|
| Gerardo Alarcon | Estructura base, ventas y facturación | CU_07, CU_08, CU_09, CU_26 y consulta DNI/RUC |
| Michael Rodriguez | Pensiones | CU_01 a CU_06 |
| Jyon Yefer Huaccha Callocsa | Menú y planes | CU_11 a CU_14, CU_22, CU_23 |
| Ian Saul Sucapuca Espinoza | Seguridad y caja | CU_10, CU_18 a CU_20, CU_24 |
| Jair Apaza | Inventario y reportes | CU_15 a CU_17, CU_21, CU_25 |

Los casos de uso siguen la numeración de la Matriz de Requerimientos v8.

## Levantar todo desde cero

### Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | 22 o superior (probado con 24.21) |
| npm | 11 |
| Backend MANÁ | Spring Boot 4 + Java 21, en IntelliJ IDEA |
| Base de datos | Oracle con el esquema `MANADB` (service name `xepdb1`) ya creado |

### 1. Backend en IntelliJ (perfil `local`)

1. Abra el proyecto del backend en IntelliJ IDEA y espere a que Maven descargue las dependencias.
2. Cree `src/main/resources/application-local.yaml` con sus datos locales. **No lo suba al repositorio.** Ejemplo, con las propiedades que usa el backend (ajuste los nombres si su backend usa otros):

   ```yaml
   spring:
     datasource:
       url: jdbc:oracle:thin:@//localhost:1521/xepdb1
       username: MANADB
       password: <contraseña de MANADB>
   app:
     jwt:
       secret: <clave base64 de 32 bytes o más>
     admin:
       email: admin@mana.pe
       password: Admin12345
       dni: "00000001"
   ```

3. En la configuración de ejecución de `ManaBackendApplication`, ponga **Active profiles: `local`** y ejecútela.
4. Compruebe que responde:
   - `http://localhost:8080/api/health` → `Backend funcionando correctamente`
   - Swagger: `http://localhost:8080/swagger-ui.html`

Al arrancar, el backend crea el usuario ADMINISTRADOR si todavía no existe.

### 2. Frontend

```bash
npm.cmd install
npm.cmd start
```

Abra **http://localhost:4200/**. `npm start` ejecuta `ng serve` con `proxy.conf.json`, que envía `/api` a `http://localhost:8080`.

> Use el puerto **4200**: el CORS del backend solo admite `http://localhost:4200`. Con otro puerto, el backend responde 403.

### 3. Usuarios de prueba (solo para desarrollo)

> **Solo para desarrollo.** Son credenciales de la base de datos local; no las use en producción.

| Rol | Correo | Contraseña | Local | Permisos |
|---|---|---|---|---|
| Dueño | `dueno@mana.pe` | `Dueno12345` | Local principal | Todos (20) |
| ADMINISTRADOR | `admin@mana.pe` | `Admin12345` | Local principal | Todos menos `LOCAL_GESTIONAR` (19); solo gestiona cajeros |
| CAJERO | `cajero@mana.pe` | `Cajero12345` | Local principal | Atención diaria, clientes, consultas (7) |

**Jerarquía de roles:** Dueño > Administrador > Cajero (en el código: `DUENO`, `ADMINISTRADOR` y `CAJERO`).

- **Dueño:** tiene todos los permisos y gestiona usuarios de cualquier rol y los locales.
- **ADMINISTRADOR:** tiene todo menos los locales y solo puede crear y gestionar **cajeros**.
- **Usuarios gestionables:** el backend lo indica con `gestionable` en cada usuario. Nadie puede cambiar su propio rol ni desactivar su propia cuenta.

**Cómo se crearon:** al arrancar, el backend crea el primer usuario (`admin@mana.pe`) si no existe. Tras el cambio de jerarquía, ese usuario apareció con rol Dueño en la base de desarrollo; se le devolvió el rol Administrador con `PATCH /api/v1/usuarios/{id}/rol`, usando el token del dueño, para tener un usuario por rol. El dueño y el cajero se crean desde **Usuarios → Nuevo usuario** (o con `POST /api/v1/usuarios`):

| | Dueño | Cajero |
|---|---|---|
| DNI | 00000002 | 00000003 |
| Nombre y apellido | Dueño Prueba | Cajero Prueba |
| Cargo | Dueño | Cajero |

## Mapa de pantallas por rol

✓ = acceso completo · 👁 = solo lectura · — = sin acceso (el menú no la muestra y la ruta lleva a "Acceso denegado").

| Pantalla | Ruta | Permiso | Dueño | Administrador | Cajero |
|---|---|---|:-:|:-:|:-:|
| Iniciar sesión / Recuperar / Restablecer | `/login`, `/recuperar`, `/restablecer?token=` | Público | ✓ | ✓ | ✓ |
| Inicio (accesos rápidos) | `/inicio` | Autenticado | ✓ | ✓ | ✓ |
| Inicio: indicadores del día | `/inicio` | REPORTE_VER | ✓ | ✓ | — |
| Mostrador de pensionistas | `/mostrador` | CONSUMO_REGISTRAR | ✓ | ✓ | ✓ |
| Anular consumo | (Mostrador) | CONSUMO_ANULAR | ✓ | ✓ | — |
| Punto de venta | `/pos` | VENTA_REGISTRAR | ✓ | ✓ | ✓ |
| Ventas (listado, detalle, cobrar pendientes) | `/ventas` | VENTA_REGISTRAR | ✓ | ✓ | ✓ |
| Anular venta | (detalle de venta) | VENTA_ANULAR | ✓ | ✓ | — |
| Mi caja, cerrar caja, arqueo | `/caja`, `/caja/cerrar`, `/caja/:id` | CAJA_OPERAR | ✓ | ✓ | ✓ |
| Historial de cajas | `/caja/historial` | CAJA_SUPERVISAR | ✓ | ✓ | — |
| Clientes | `/clientes` | CLIENTE_LEER / CLIENTE_ESCRIBIR | ✓ | ✓ | ✓ |
| Contratos (listado y detalle) | `/contratos` | CONTRATO_LEER | ✓ | ✓ | 👁 |
| Nuevo contrato / Renovar | `/contratos/nuevo`, `/contratos/:id/renovar` | CONTRATO_REGISTRAR | ✓ | ✓ | — |
| Anular contrato | (detalle de contrato) | CONTRATO_ANULAR | ✓ | ✓ | — |
| Menú: programación, banco de platos, precios | `/menu/...` | MENU_LEER / MENU_GESTIONAR | ✓ | ✓ | 👁 |
| Planes | `/planes` | PLAN_GESTIONAR | ✓ | ✓ | — |
| Calendario (días de no atención) | `/calendario` | CALENDARIO_GESTIONAR | ✓ | ✓ | — |
| Inventario (stock, compras, kardex, bebidas, proveedores) | `/inventario/...` | INVENTARIO_GESTIONAR | ✓ | ✓ | — |
| Gastos | `/gastos` | GASTO_GESTIONAR | ✓ | ✓ | — |
| Reportes (6) | `/reportes/...` | REPORTE_VER | ✓ | ✓ | — |
| Usuarios | `/usuarios` | USUARIO_GESTIONAR | ✓ (todos los roles) | ✓ (solo cajeros) | — |
| Locales | `/locales` | LOCAL_GESTIONAR | ✓ | — | — |

En **Usuarios**, Editar, Cambiar rol y Desactivar solo aparecen en los usuarios con `gestionable = true`; Cambiar rol y Desactivar nunca se ofrecen sobre la propia cuenta. El administrador solo puede elegir el rol CAJERO, tanto al crear como al cambiar el rol, y crea usuarios en su propio local (no tiene `LOCAL_GESTIONAR` para listar locales).

**Menú lateral por rol:**
- **Dueño:** los 5 grupos completos.
- **ADMINISTRADOR:** los 5 grupos, sin Locales.
- **CAJERO:** Atención diaria, Pensiones y Cocina y precios (solo Menú).

Las pantallas que cobran o devuelven dinero (nuevo contrato, renovar, anular contrato, POS, cobrar o anular venta, recargo para llevar en el mostrador) exigen una **caja abierta**. Sin caja muestran "Abra su caja para continuar" y deshabilitan el botón de guardar.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm.cmd start` | Servidor de desarrollo en `http://localhost:4200` con proxy al backend |
| `npx.cmd ng build` | Compila para producción en `dist/mana_frontend` |
| `npx.cmd ng test --watch=false` | Ejecuta las pruebas unitarias (Vitest) |

### Pruebas unitarias

| Archivo | Qué verifica |
|---|---|
| `features/pos/utils/totales.spec.ts` | Totales del POS: 2 menús de almuerzo para llevar = 26.00; 1 almuerzo + 1 entrada para llevar = 18.00; 1 desayuno para llevar = 4.50; bebidas sin recargo |
| `core/utils/composicion.spec.ts` | Validación exacta de la composición del menú (cantidades, repetir pan, categorías extra, platos fuera del menú) |
| `shared/components/selector-pagos/selector-pagos.spec.ts` | Suma exacta de pagos, montos ≤ 0 y comportamiento del componente |
| `core/guards/permiso.guard.spec.ts` | `permisoGuard` deja pasar o redirige a `/acceso-denegado` |
| `core/interceptors/error.interceptor.spec.ts` | 401 cierra la sesión; 403 no; el 401 del login no cierra sesión |
| `features/contratos/utils/renovacion.spec.ts` | Botón Renovar: solo ACTIVO y a 3 días o menos del fin |
| `core/config/menu.spec.ts` | Grupos del menú lateral visibles por rol y grupo de la ruta actual |
| `features/usuarios/models/usuario.model.spec.ts` | Roles asignables: el dueño asigna cualquiera; el administrador, solo CAJERO |

## Estructura

```
src/app/
├── core/       auth/, guards/, interceptors/, config/menu.ts, models/, services/ (catálogos, caja abierta), utils/
├── layout/     main-layout/, header/, sidebar/
├── shared/     directives/si-permiso.ts
│               components/ paginador, selector-pagos, confirmar-anulacion, confirmar-dialogo,
│                           estado-badge, aviso-caja, selector-composicion
│               pages/ no-encontrado, acceso-denegado
└── features/   auth, inicio, caja, clientes, contratos, mostrador, pos, ventas, menu, planes,
                calendario, inventario, gastos, reportes, usuarios, locales
                (cada uno con <modulo>.routes.ts, models/, services/ y pages/ de .ts + .html + .css)
```

## Capturas

Pendientes: inicio por rol, mostrador, punto de venta y ticket, nuevo contrato con simulación, cierre de caja, programación semanal del menú y un reporte con barras.

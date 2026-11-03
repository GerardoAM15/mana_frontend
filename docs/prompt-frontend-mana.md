# Prompt para Codex — Frontend MANÁ (Angular)

> Antes de pegar este prompt, prepara la carpeta como indica la guía (proyecto Angular creado, carpetas `referencia/` y `docs/`).

---

Eres un desarrollador senior de Angular. Vas a construir el frontend del sistema **MANÁ** (comedor universitario: pensiones prepago, punto de venta, caja, menú, inventario y reportes) dentro del proyecto Angular que ya está abierto. El backend ya existe, está terminado y funciona.

## 1. Fuentes de verdad (léelas antes de escribir código)

1. **`docs/ENDPOINTS.md` y `docs/openapi.json`**: el contrato HTTP real del backend (rutas, permisos, request y response de los 102 endpoints). Los modelos TypeScript deben coincidir **exactamente** con esos JSON. No inventes campos ni rutas.
2. **`referencia/pharmafrontend/`**: la **arquitectura obligatoria** (estilo del profesor). Copia su estructura de carpetas, su forma de escribir componentes, servicios, modelos y rutas, sus utilidades y sus clases CSS.
3. **`referencia/examen_frontend/`**: solo para la parte que pharmafrontend no tiene: **autenticación** (AuthService con signals, interceptores, guards, directiva de permisos y menú filtrado por permisos).
4. **`docs/prompt-backend-mana.md`**: las reglas de negocio, para entender cada pantalla.

Si encuentras una contradicción entre este prompt y `docs/openapi.json`, **manda el OpenAPI**. Detente y avísame; no modifiques el backend.

## 2. Stack y configuración

- La misma versión de Angular que `referencia/pharmafrontend` (22.x): componentes standalone, signals, control flow (`@if`, `@for`), Reactive Forms con `NonNullableFormBuilder`, `inject()`, lazy loading. **Sin librerías de UI** (ni Material ni Bootstrap) y **sin librerías de gráficos**. Todo con CSS propio, como pharmafrontend.
- `environment.apiUrl = '/api/v1'` y `proxy.conf.json` apuntando a **`http://localhost:8080`** (en pharmafrontend apunta a 8081; aquí es 8080). Configura `ng serve` para usar el proxy.
- Moneda: `CurrencyPipe` con `'PEN'` y símbolo `S/`. Locale `es-PE` registrado. Fechas `dd/MM/yyyy`; zona America/Lima.

## 3. Arquitectura (igual que pharmafrontend)

```
src/app/
├── core/
│   ├── auth/            auth.models.ts, auth.service.ts          (de examen_frontend)
│   ├── guards/          auth.guard.ts, invitado.guard.ts, permiso.guard.ts
│   ├── interceptors/    auth.interceptor.ts, error.interceptor.ts
│   ├── config/          menu.ts  (cada ítem con su permiso)
│   ├── models/          error-response.ts, pagina-response.ts, catalogo.model.ts
│   ├── services/        catalogo-service.ts, caja-estado.service.ts (estado global de la caja abierta)
│   └── utils/           http-error.ts, numeros.ts, texto.ts, fechas.ts
├── layout/              main-layout/, header/, sidebar/
├── shared/
│   ├── directives/      si-permiso.ts
│   ├── components/      paginador/, selector-pagos/, confirmar-anulacion/, estado-badge/
│   └── pages/           no-encontrado/, acceso-denegado/
└── features/<modulo>/
    ├── <modulo>.routes.ts
    ├── models/<entidad>.model.ts
    ├── services/<entidad>-service.ts
    └── pages/<entidad>-list | <entidad>-form | <entidad>-detalle/   (cada una con .ts + .html + .css)
```

- Cada página tiene **tres archivos** (`.ts`, `.html`, `.css`), como en pharmafrontend. Nada de templates inline.
- Los servicios son `@Injectable({ providedIn: 'root' })` con `inject(HttpClient)` y `private readonly url = \`${environment.apiUrl}/...\``.
- El estado de cada página usa **signals**: `cargando`, `error`, `resultado`, `pagina`. Usa `computed` para totales.
- Los listados paginados usan `PaginaResponse<T>` (`contenido`, `pagina`, `tamanio`, `totalElementos`, `totalPaginas`, `ultima`) y un componente `paginador` reutilizable.
- Errores: `core/utils/http-error.ts` igual que pharmafrontend (`mensajeError` lee `message`; `erroresDeValidacion` lee `validationErrors`). Muestra los errores de campo debajo de cada input.
- `styles.css`: reutiliza las clases de pharmafrontend (`.page`, `.card`, `.btn`, `.btn-primary`, `.btn-peligro`, `.input`, `.tabla`, `.badge`, `.alerta`, `.page-header`, `.eyebrow`, `@media print`), pero con una **paleta propia de MANÁ** definida en variables CSS (`--color-primario`, etc.): vino tinto `#7a1f2b` como primario, dorado `#c58a00` como acento y fondo crema `#faf6f0`.
- Diseño **responsive**: el mostrador y el POS deben usarse bien en una tablet (≥ 768 px).

## 4. Autenticación y permisos (tomado de examen_frontend)

- `POST /auth/login` con `{correo, clave}`. Guarda la sesión en `sessionStorage` y en un signal: token, `usuarioId`, `nombreCompleto`, `rol`, `localId`, `localNombre`, `permisos` y la hora de expiración. Al vencer el token, cierra la sesión sola.
- `authInterceptor` agrega `Authorization: Bearer` solo a las peticiones a `/api/v1`.
- `errorInterceptor`: con **401**, cierra sesión y redirige a `/login?returnUrl=...` (salvo en el login mismo). Con **403**, no cierra sesión; el componente muestra el mensaje.
- Guards: `authGuard` en el layout, `invitadoGuard` en login, y `permisoGuard` leyendo `data.permiso` de la ruta (redirige a `/acceso-denegado`).
- Directiva `*siPermiso="'VENTA_ANULAR'"` para ocultar botones.
- El menú lateral se filtra por permisos. El header muestra el nombre, el rol, el local, el estado de la caja (abierta / cerrada) y el botón "Salir".
- Pantallas públicas: **Iniciar sesión**, **Recuperar contraseña** (`POST /auth/recuperar`, siempre muestra "Si el correo existe, te enviamos un enlace") y **Restablecer contraseña** (`/restablecer?token=...`, `POST /auth/restablecer`).

## 5. Estado de caja (servicio global)

`CajaEstadoService` mantiene en un signal la caja abierta del usuario (`GET /cajas/actual`; un 404 significa que no hay caja abierta). Se carga al iniciar sesión y se refresca después de abrir o cerrar caja.

Las pantallas que **cobran** (nuevo contrato, renovar, anular contrato, POS, consumo para llevar con recargo) muestran un aviso **"Abra su caja para continuar"** con un botón a Caja si no hay caja abierta, y deshabilitan el botón de guardar.

## 6. Módulos y pantallas

Cada ruta lleva `data: { permiso: '...' }` según `docs/ENDPOINTS.md`.

### 6.1 Inicio (`/inicio`)
Saludo, local y fecha. Tarjetas de acceso rápido según permisos (Mostrador, POS, Caja, Nuevo contrato). Si tiene permiso de reportes, muestra 3 indicadores del día: consumos de hoy, ventas de hoy y contratos por vencer en 3 días.

### 6.2 Caja (`/caja`)
- **Mi caja**:
  - Sin caja abierta → formulario "Abrir caja" con monto inicial.
  - Con caja abierta → resumen en vivo (`GET /cajas/{id}/resumen`) con una tabla por método de pago (esperado y cantidad de movimientos) y los contadores de ventas, consumos y contratos.
- **Cerrar caja**: tabla por método con *Esperado*, *Contado* (input) y *Diferencia* calculada en vivo con `computed` (verde si es 0, rojo si es distinta). Debajo, la observación y el total. Pide confirmación antes de cerrar. Si el backend responde 409 por ventas pendientes, muestra el mensaje con un enlace a las ventas pendientes.
- **Historial** (permiso `CAJA_SUPERVISAR`): listado paginado con filtros (desde, hasta, usuario) y detalle del arqueo. Debe poder imprimirse.

### 6.3 Clientes (`/clientes`)
Listado paginado con búsqueda, formulario (DNI de 8 dígitos, nombre, apellido, teléfono) y desactivar. Desde el detalle del cliente: botón "Nuevo contrato" y su contrato vigente.

### 6.4 Contratos (`/contratos`)
- **Listado** paginado con filtros (DNI, estado, desde, hasta) y `estado-badge` por estado (PROGRAMADO, ACTIVO, FINALIZADO, ANULADO).
- **Nuevo contrato** (en una sola pantalla con secciones):
  1. Buscar cliente por DNI (si no existe, ofrecer crearlo).
  2. Elegir plan (Semanal / Mensual), fecha de inicio (mínimo hoy) y servicios D/A/C con checkboxes (solo los del plan).
  3. **Simulación en vivo**: cada vez que cambian plan, fecha o servicios, llamar a `POST /contratos/simular` (con `debounceTime`) y mostrar la fecha fin y una tabla por servicio con raciones, precio, subtotal y el total. Si la simulación da 409 (por ejemplo, superposición), mostrar el mensaje.
  4. **Pagos** con el componente `selector-pagos` (varias filas método + monto + referencia). Muestra "Pagado / Falta / Sobra" en vivo y solo habilita "Registrar" cuando la suma es **exactamente** igual al total.
  5. Al registrar, ir al detalle.
- **Detalle**: datos, fechas, estado, tabla por servicio (contratadas, saldo, precio), pagos, consumos, y el contrato anterior o siguiente si es renovación. Botones según permiso y estado:
  - **Renovar**: solo si está ACTIVO y faltan ≤ 3 días. Usa la misma simulación y los mismos pagos.
  - **Anular**: solo si no tiene consumos. Pide el motivo con `confirmar-anulacion` (10 a 250 caracteres) y avisa que se devolverán los pagos.
- Comprobante imprimible del contrato.

### 6.5 Mostrador de pensionistas (`/mostrador`) — pantalla clave
Debe ser rápida, con botones grandes, para usar en tablet.
1. Buscador por DNI o nombre (`GET /pensionistas/buscar?q=`) con resultados mientras se escribe (`debounceTime`). Al elegir, muestra el nombre, el contrato, las fechas y **el saldo por servicio** en tarjetas.
2. Selector de servicio D/A/C. Preselecciona según la hora: antes de las 11:00 Desayuno, de 11:00 a 16:00 Almuerzo, después Cena. Deshabilita los servicios que el contrato no incluye o que no tienen saldo.
3. Platos del menú de hoy (`/pos/catalogo?servicio=` o el endpoint de menú del día que defina el OpenAPI), **agrupados por categoría**, mostrando cuántos se requieren. Por ejemplo: "Líquido: elige 1", "Pan: elige 2 (puede repetir)". El botón "Registrar" se habilita solo cuando la selección cumple exactamente la composición.
4. Casilla "Para llevar". Si el recargo del servicio es mayor a 0, muestra "+ S/ 2.00" y pide el método de pago (requiere caja abierta). Si es 0 (desayuno), no pide nada.
5. Al registrar: mensaje de éxito grande, actualización del saldo y limpieza para el siguiente cliente. Los errores 409 se muestran tal cual (por ejemplo, "Ya consumió el almuerzo hoy" o "La cena no se atiende los viernes").
6. Debajo, la lista de **consumos de hoy** (paginada) con el botón **Anular** (permiso `CONSUMO_ANULAR`, pide el motivo).

### 6.6 Punto de venta (`/pos`) — pantalla clave
Diseño en dos columnas: catálogo a la izquierda y pedido a la derecha.
- Selector de servicio (preseleccionado por hora, como en el mostrador) que carga `GET /pos/catalogo?servicio=`.
- **Catálogo** en tres pestañas:
  - **Menús**: al tocar uno, se abre un panel para elegir los platos según la composición (las mismas reglas que el mostrador).
  - **Sueltos**: platos con precio suelto. En la cena esta pestaña no aparece o dice "En la cena solo se vende el menú completo".
  - **Bebidas**: con su stock; deshabilitadas si el stock es 0.
- **Pedido**: líneas con cantidad (+/−), precio, recargo y subtotal, más la casilla "Para llevar". Muestra en vivo, con `computed`, el **subtotal**, el **recargo para llevar** (menú y suelto según el catálogo; bebidas y desayuno en 0) y el **total**, para que coincida con lo que calcula el backend.
- Botones: **"Cobrar ahora"** (abre `selector-pagos` y envía la venta con `pagos`) y **"Dejar pendiente"**.
- Ticket imprimible tras registrar (número `V-000123`, líneas, total y pagos).
- **Ventas** (`/ventas`): listado paginado con filtros (fecha, estado, caja), detalle, **Cobrar** las pendientes y **Anular** (permiso `VENTA_ANULAR`, motivo, y aviso de devolución si estaba pagada).

### 6.7 Menú (`/menu`)
- **Banco de platos**: CRUD con categoría y filtro por categoría y activo.
- **Programación semanal**: grilla de **lunes a domingo × D/A/C** con navegación por semanas. Cada celda muestra los platos programados y al hacer clic abre un editor para marcar o desmarcar platos del banco (`PUT /menus`). Acciones: **Clonar día** (elegir fecha origen, fecha destino y servicios) y **Copiar segundos del almuerzo a la cena**. Los días que no se atiende un servicio (por ejemplo, la cena del viernes) se muestran grisados.
- **Precios**:
  - Tarifas de pensionista.
  - Menús públicos (reglas de cobro) con su composición y recargo; si el backend responde 409 por menú duplicado activo, muestra el mensaje.
  - Precios sueltos por servicio y categoría.

### 6.8 Planes y calendario (`/planes`, `/calendario`)
CRUD de tipos de plan con sus servicios. Días de no atención (feriados) por local, con fecha y motivo.

### 6.9 Inventario (`/inventario`)
Bebidas (CRUD), proveedores con las bebidas que venden, **nueva compra** (proveedor, fecha y líneas de bebida, presentaciones, unidades por presentación y costo total, con el total en vivo), stock por local y kardex con filtros.

### 6.10 Gastos (`/gastos`)
Listado paginado por rango de fechas con el total del periodo, formulario y desactivar.

### 6.11 Reportes (`/reportes`)
Una página por reporte del OpenAPI (ingresos mensuales, platos más consumidos, contratos por vencer, ventas vs pensiones, asistencia diaria, gastos vs ingresos), cada una con filtros (desde, hasta y servicio si aplica), una tabla y **barras comparativas hechas con CSS** (como el reporte de ventas por categoría de pharmafrontend), tarjetas de totales y la opción de imprimir.

### 6.12 Administración (`/usuarios`, `/locales`)
Usuarios: crear (persona + empleado + usuario + rol + local), editar, cambiar rol y desactivar. Locales: CRUD. Ambos solo con permiso de ADMINISTRADOR.

## 7. Componentes compartidos

- `paginador`: anterior / siguiente, "Página X de Y" y total de registros.
- `selector-pagos`: filas de método (catálogo de métodos de pago) + monto + referencia opcional. Recibe el `total` como input, emite la lista de pagos y expone si es válida (suma exacta y sin montos ≤ 0).
- `confirmar-anulacion`: modal con motivo (10–250 caracteres, contador) y confirmación.
- `estado-badge`: colores por estado de contrato, venta o caja.
- Catálogos (`GET /catalogos`): cárgalos una vez y cachéalos en `CatalogoService` (servicios, métodos de pago, categorías, roles y días de atención).

## 8. Calidad

- Validaciones en los formularios iguales a las del backend (DNI de 8 dígitos, montos > 0, motivo de 10 a 250 caracteres, etc.), pero **siempre** muestra también los errores que devuelve el backend.
- Botones deshabilitados y texto "Guardando..." mientras se envía, para evitar dobles envíos.
- Estado vacío ("No hay registros") y de carga en todos los listados.
- Tests con el runner que ya tiene el proyecto (vitest, como pharmafrontend): cálculo de totales del POS (2 menús de almuerzo para llevar = 26.00; 1 almuerzo + 1 entrada para llevar = 18.00; 1 desayuno para llevar = 4.50), validación de composición del menú, `selector-pagos` (suma exacta), `permisoGuard` y `errorInterceptor` (401 cierra sesión, 403 no).
- `README.md` en español: cómo instalar, cómo ejecutar con el backend en 8080, usuarios de prueba, mapa de pantallas por rol y capturas pendientes.

## 9. Forma de trabajo (por fases)

Confirma que `ng build` compila y que la app carga al final de cada fase antes de seguir:
1. Estructura base, estilos, layout, catálogos, proxy y modelos TypeScript a partir del OpenAPI.
2. Autenticación completa (login, recuperar, restablecer, guards, interceptores, menú por permisos) + Caja.
3. Clientes + Contratos (simulación, pagos, detalle, renovar, anular).
4. Mostrador de pensionistas.
5. Menú (banco, programación semanal, clonar, copiar a cena) + precios + planes + calendario.
6. Punto de venta + ventas.
7. Inventario + gastos.
8. Reportes + administración + tests + README.

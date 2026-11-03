# CLAUDE.md

## Reglas del proyecto

- Las instrucciones completas están en `docs/prompt-frontend-mana.md`. Síguelas por fases.
- La arquitectura obligatoria es la de `referencia/pharmafrontend/` (estilo del profesor). La autenticación (guards, interceptores, permisos) se toma de `referencia/examen_frontend/`.
- Cada página y componente usa SIEMPRE tres archivos: `.ts`, `.html` y `.css`. Nunca templates ni estilos inline.
- El contrato del backend es `docs/openapi.json` y `docs/ENDPOINTS.md`. No inventes campos ni rutas. Si algo no cuadra, detente y avisa; no cambies el backend.
- `referencia/` es solo de consulta: no la modifiques ni la compiles.
- Al terminar cada fase, ejecuta `npx.cmd ng build` y confirma que compila.

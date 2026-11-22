# Proyecto: Inventario Papelería (Fase 1 MongoDB → Fase 2 SQL)

## Stack (NO cambiar sin aprobación humana)
- Node.js + Express + EJS + Mongoose + MongoDB.
- MVC estricto: models/ → controllers/ → routes/ → views/.
- Vistas: Bootstrap 5 vía CDN + express-ejs-layouts.

## Regla de Oro para el Modelo de Datos
- `Producto` usa `categoriaId` como referencia (`ObjectId`, `ref: 'Categoria'`). NUNCA embebas Categoría.
- Todo campo nuevo en un esquema debe verificarse contra `public/docs/06-plan-migracion-sql.md`.
- No crear arrays ni objetos anidados en `Producto`.

## Regla de Vistas (UI)
- Bootstrap 5 vía CDN en `layout.ejs`. No instalar Bootstrap por npm.
- Vistas hijas con `express-ejs-layouts`; solo contenido interno.
- Partials en `views/partials/`. CSS propio solo en `public/css/custom.css`.

## Comandos
- `npm run dev` | `npm start` | `npm run seed` | `npm test`

## Documentación Obligatoria
- `DOCUMENTACION-IA.md`: contrato operativo detallado para agentes. Leerlo completo antes de escribir código.
- `DOCUMENTACION-HUMANOS.md`: explicación del proyecto para personas (arquitectura, carpetas, contratos, operación).
- `public/docs/`: documentos temáticos de referencia (01 a 06).

## Flujo Obligatorio Antes de Escribir Código
1. Leer `DOCUMENTACION-IA.md` y `public/docs/01-arquitectura.md`.
2. Según la tarea: modelos → `public/docs/03-modelo-datos.md`, rutas/controllers → `public/docs/04-contratos-api.md`, vistas/estructura → `public/docs/02-estructura-carpetas.md`, convenciones → `public/docs/05-convenciones.md`.
3. Si se modifica el modelo de datos, verificar `public/docs/06-plan-migracion-sql.md`.
4. Si hay ambigüedad, preguntar antes de asumir.
5. Al terminar, ejecutar `npm test` y actualizar `DOCUMENTACION-HUMANOS.md` y `DOCUMENTACION-IA.md` si cambió arquitectura, contrato, modelo o flujo.

## Prohibiciones
- No usar `find()` sin `.lean()` en listados.
- No modificar `public/docs/` sin autorización humana.
- No instalar dependencias fuera de las listadas en `public/docs/05-convenciones.md`.
- No usar estilos inline ni `<style>` en las vistas.
- No exponer detalles internos de errores en producción.

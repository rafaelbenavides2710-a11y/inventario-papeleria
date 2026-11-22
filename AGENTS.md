# Proyecto: Inventario Papelería (Fase 1 MongoDB → Fase 2 SQL)

## Stack (NO cambiar sin aprobación humana)
- Node.js + Express + EJS + Mongoose + MongoDB.
- MVC estricto: models/ → controllers/ → routes/ → views/.
- Vistas: Bootstrap 5 vía CDN + express-ejs-layouts.

## Regla de Oro para el Modelo de Datos
- `Producto` usa `categoriaId` como referencia (`ObjectId`, `ref: 'Categoria'`). NUNCA embebas Categoría.
- Todo campo nuevo en un esquema debe verificarse contra `docs/06-plan-migracion-sql.md`.
- No crear arrays ni objetos anidados en `Producto`.

## Regla de Vistas (UI)
- Bootstrap 5 vía CDN en `layout.ejs`. No instalar Bootstrap por npm.
- Vistas hijas con `express-ejs-layouts`; solo contenido interno.
- Partials en `views/partials/`. CSS propio solo en `public/css/custom.css`.

## Comandos
- `npm run dev` | `npm start` | `npm run seed` | `npm test`

## Flujo Obligatorio Antes de Escribir Código
1. Leer `docs/01-arquitectura.md`.
2. Según la tarea: modelos → `03`, rutas/controllers → `04`, vistas/estructura → `02`, convenciones → `05`.
3. Si se modifica el modelo de datos, verificar `docs/06-plan-migracion-sql.md`.
4. Si hay ambigüedad, preguntar antes de asumir.

## Prohibiciones
- No usar `find()` sin `.lean()` en listados.
- No modificar `docs/` sin autorización humana.
- No instalar dependencias fuera de las listadas en `docs/05-convenciones.md`.

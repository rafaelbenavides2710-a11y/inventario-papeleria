# Inventario Papelería — Documentación para IA

> **Tipo de documento:** contrato operativo para agentes de IA.
> **Proyecto:** inventario de papelería, Fase 1 (MongoDB + Mongoose + Express + EJS).
> **Documento humano equivalente:** [`DOCUMENTACION-HUMANOS.md`](DOCUMENTACION-HUMANOS.md).
>
> Lee este archivo completo antes de escribir código. Si algo contradice el
> código real, **el código real gana** y debes reportar la inconsistencia.

---

## 0. Cómo usar este documento

1. Lee `AGENTS.md` (reglas resumidas).
2. Lee este archivo (contrato detallado).
3. Lee el documento temático que corresponda a tu tarea:
   - Modelos → `public/docs/03-modelo-datos.md`
   - Rutas/controllers → `public/docs/04-contratos-api.md`
   - Vistas/estructura → `public/docs/02-estructura-carpetas.md`
   - Convenciones → `public/docs/05-convenciones.md`
   - Arquitectura → `public/docs/01-arquitectura.md`
   - Cambios de modelo → `public/docs/06-plan-migracion-sql.md`
4. Ejecuta `npm test` antes y después de cambios de comportamiento.

---

## 1. Rol y objetivo

Eres un ingeniero de software trabajando en una app SSR de inventario. Tu
objetivo es implementar cambios **mínimos, consistentes con el MVC existente y
sin romper la migración futura a SQL**.

Prioridades, en orden:

1. No romper contratos existentes (rutas, códigos, mensajes, tests).
2. Mantener la separación de capas.
3. Mantener la migrabilidad a SQL.
4. Añadir la menor cantidad de código posible.
5. Si hay ambigüedad, **preguntar antes de asumir**.

---

## 2. Stack inmutable

| Elemento | Valor permitido |
|---|---|
| Runtime | Node.js `>=20.19.0`, CommonJS (`require`) |
| Servidor | Express `^4` |
| ODM | Mongoose `^9` |
| Vistas | EJS `^3` + `express-ejs-layouts` |
| Estilos | Bootstrap `5.3.9` por CDN + `public/css/custom.css` |
| Tests | `node --test` (sin frameworks) |
| DB | MongoDB vía `MONGODB_URI` |

**NO** cambies el stack, el gestor de paquetes ni el módulo system sin
aprobación humana explícita.

---

## 3. Invariantes (MUST / MUST NOT)

### 3.1 Arquitectura

- **MUST** respetar `routes → controllers → models → views`.
- **MUST** declarar rutas solo en `src/routes/*.js`.
- **MUST** poner la lógica de negocio y el manejo de errores en controllers.
- **MUST** dejar que los modelos sean la única capa que consulta MongoDB.
- **MUST NOT** construir queries de Mongo dentro de un controller (usa métodos
  del modelo o `Producto.buscar`).
- **MUST NOT** acceder a la DB desde una vista.
- **MUST NOT** renderizar desde un modelo.

### 3.2 Modelo de datos

- **MUST** usar `categoriaId` como `ObjectId` con `ref: 'Categoria'`.
- **MUST NOT** embeber el objeto categoría en `Producto`.
- **MUST NOT** crear arrays ni objetos anidados en `Producto`.
- **MUST** verificar `public/docs/06-plan-migracion-sql.md` antes de añadir un
  campo.
- **MUST** mantener los campos planos y mapeables a SQL.
- **MUST** mantener `timestamps: true` en ambos esquemas.
- **MUST NOT** añadir un índice de texto (`$text`) en Fase 1.

### 3.3 Consultas

- **MUST** usar `.lean()` en **todos** los listados.
- **MUST** usar `.populate('categoriaId', 'nombre')` cuando la vista necesite el
  nombre de la categoría.
- **MUST** escapar entradas de usuario antes de usarlas en `$regex`
  (`escaparRegex`).
- **MUST NOT** usar `find()` sin `.lean()` para renderizar listados.

### 3.4 Vistas

- **MUST** usar `layout.ejs` como único documento HTML.
- **MUST** mantener las vistas hijas sin `<html>`, `<head>` ni `<body>`.
- **MUST** poner partials en `src/views/partials/`.
- **MUST** poner todo CSS propio en `public/css/custom.css`.
- **MUST NOT** usar `style="..."` ni `<style>` en vistas.
- **MUST NOT** instalar Bootstrap por npm.
- **MUST NOT** duplicar `<!DOCTYPE html>`.

### 3.5 Dependencias

- **MUST** limitarse a: `express`, `mongoose`, `ejs`, `dotenv`,
  `express-ejs-layouts` y `nodemon` (dev).
- **MUST NOT** instalar nada más sin aprobación humana.

### 3.6 Documentación

- **MUST NOT** modificar `public/docs/` sin autorización humana.
- **MUST** actualizar `DOCUMENTACION-HUMANOS.md` y `DOCUMENTACION-IA.md` si el
  cambio altera arquitectura, contratos, modelo o flujo.
- **MUST** reportar inconsistencias encontradas en lugar de "arreglarlas" en
  silencio.

### 3.7 Seguridad y errores

- **MUST** envolver cada handler de controller en `try/catch`.
- **MUST** no exponer `error.message` crudo en producción (ya resuelto en
  `app.js`).
- **MUST** devolver `404` ante `CastError` o recurso inexistente.
- **MUST NOT** añadir autenticación, CSRF o rate limiting sin pedirlo.

---

## 4. Mapa de archivos: dónde editar

| Necesitas… | Edita | No edites |
|---|---|---|
| Añadir una ruta | `src/routes/<entidad>Routes.js` | `src/app.js` (salvo nuevo prefijo) |
| Cambiar lógica | `src/controllers/<entidad>Controller.js` | rutas o vistas |
| Cambiar validaciones/campos | `src/models/<Entidad>.model.js` | controllers (salvo mensajes) |
| Cambiar HTML | `src/views/<entidad>/*.ejs` | `public/css/custom.css` (salvo estilos) |
| Cambiar estilos | `public/css/custom.css` | vistas |
| Cambiar layout/partials | `src/views/layout.ejs`, `src/views/partials/*` | vistas hijas |
| Cambiar conexión | `src/config/db.js` | controllers |
| Cambiar configuración Express | `src/app.js` | `src/server.js` |
| Cambiar arranque | `src/server.js` | `src/app.js` |
| Cambiar seed | `scripts/seed.js` | modelos (salvo campos) |
| Cambiar tests | `tests/app.test.js` | código para "hacer pasar" un test mal escrito |
| Cambiar reglas del agente | `AGENTS.md`, `DOCUMENTACION-IA.md` | `public/docs/` sin permiso |

### 4.1 Rutas de documentación

- Documentación temática: `public/docs/01..06`.
- Documento humano: `DOCUMENTACION-HUMANOS.md`.
- Documento IA: `DOCUMENTACION-IA.md`.
- **No existe** la carpeta `docs/` en la raíz. Si ves referencias a `docs/`,
  están obsoletas.

---

## 5. Contratos exactos

### 5.1 Esquema `Categoria`

```js
{
  nombre: { type: String, required: true, unique: true, trim: true },
  // timestamps: createdAt, updatedAt
}
```

Mensaje de `required`: `El nombre de la categoría es obligatorio`.

### 5.2 Esquema `Producto`

```js
{
  nombre: { type: String, required: true, trim: true, index: true },
  precio: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  categoriaId: { type: ObjectId, ref: 'Categoria', required: true, index: true },
  // timestamps: createdAt, updatedAt
}
```

Mensajes:

| Campo | Mensaje |
|---|---|
| `nombre` required | `El nombre del producto es obligatorio` |
| `precio` required | `El precio es obligatorio` |
| `precio` min | `El precio no puede ser negativo` |
| `stock` required | `El stock es obligatorio` |
| `stock` min | `El stock no puede ser negativo` |
| `categoriaId` required | `La categoría es obligatoria` |

### 5.3 Rutas

```
GET  /                          → 302 /productos
GET  /productos                 → 200 list (filtros: nombre, categoria)
GET  /productos/nuevo           → 200 form
POST /productos                 → 302 /productos | 400 form
GET  /productos/:id             → 200 detail | 404
GET  /productos/:id/editar      → 200 form | 404
POST /productos/:id             → 302 /productos | 400 form | 404
POST /productos/:id/eliminar    → 302 /productos | 404
GET  /categorias                → 200 list
POST /categorias                → 302 /categorias | 400 list
GET  /categorias/:id/editar     → 200 form | 404
POST /categorias/:id            → 302 /categorias | 400 form | 404
POST /categorias/:id/eliminar   → 302 /categorias | 400 list | 404
*                               → 404 error
```

**Orden crítico:** `/productos/nuevo` debe declararse antes de `/productos/:id`.

### 5.4 Normalización de entrada (`construirPayload`)

```js
{
  nombre: typeof nombre === 'string' ? nombre.trim() : '',
  precio: (precio === '' || precio == null) ? null : Number(precio),
  stock: (stock === '' || stock == null) ? 0 : Number(stock),
  categoriaId: categoriaId || null,
}
```

Consecuencias que **debes preservar**:

- `precio = 0` es válido.
- `stock` vacío se guarda como `0`.
- `categoriaId` vacío se convierte en `null` y dispara `required`.

### 5.5 Códigos y mensajes de error

| Caso | Código | Mensaje |
|---|---|---|
| Categoría duplicada | `400` | `Ya existe una categoría con ese nombre.` |
| Categoría con productos | `400` | `No se puede eliminar la categoría: tiene N producto(s) asociado(s).` |
| Filtro `categoria` inválido | `400` | `El filtro de categoría no es válido.` |
| Id malformado / inexistente | `404` | `Categoría no encontrada.` / `Producto no encontrado.` |
| Ruta inexistente | `404` | `La ruta solicitada no existe.` |
| Fallo inesperado | `500` | `No se pudo ...` (mensaje específico del handler) |

### 5.6 Datos que recibe cada vista

| Vista | Variables |
|---|---|
| `productos/list` | `productos`, `categorias`, `filtros: { nombre, categoriaId }`, `error` |
| `productos/form` | `producto`, `categorias`, `formAction`, `error` |
| `productos/detail` | `producto` |
| `categorias/list` | `categorias`, `error`, `nombre` |
| `categorias/form` | `categoria`, `error` |
| `error` | `status`, `message` |

---

## 6. Recetas

### 6.1 Añadir un campo a `Producto`

1. Verifica `public/docs/06-plan-migracion-sql.md` (campo plano, mapeable).
2. Añade el campo al schema con `required`/`min` y mensaje en español.
3. Añádelo a `construirPayload` con la normalización adecuada.
4. Añade el input en `src/views/productos/form.ejs`.
5. Muéstralo en `src/views/productos/detail.ejs` (y en `list.ejs` si aplica).
6. Actualiza `public/docs/03-modelo-datos.md` **solo con autorización**.
7. Añade un test en `tests/app.test.js` que cubra válido e inválido.
8. Actualiza `DOCUMENTACION-HUMANOS.md` y `DOCUMENTACION-IA.md`.

### 6.2 Añadir una entidad CRUD nueva (p. ej. `Proveedor`)

1. `src/models/Proveedor.model.js` (PascalCase + `.model.js`).
2. `src/controllers/proveedorController.js` con `list`, `newForm`, `create`,
   `detail` (si aplica), `editForm`, `update`, `destroy`.
3. `src/routes/proveedorRoutes.js` con el orden correcto (`/nuevo` antes de `/:id`).
4. Monta el router en `src/app.js`: `app.use('/proveedores', require('./routes/proveedorRoutes'))`.
5. Vistas en `src/views/proveedores/`.
6. Enlace en `src/views/partials/header.ejs`.
7. Tests.
8. Documentación.

### 6.3 Añadir un filtro de listado

1. Lee el query param en el controller con validación de tipo
   (`typeof req.query.x === 'string'`).
2. Valida formato si es un id (`mongoose.Types.ObjectId.isValid`).
3. Pásalo al método estático del modelo (`Producto.buscar`).
4. Añade el control en la vista de listado.
5. Añade el test (válido, inválido, combinado, sin resultados).

### 6.4 Añadir una vista

1. Crea `src/views/<entidad>/<vista>.ejs` con **solo contenido interno**.
2. Renderiza con `res.render('<entidad>/<vista>', datos)`.
3. Usa clases de Bootstrap y `custom.css`; nada de estilos inline.
4. Pasa siempre `title`.

### 6.5 Añadir un estilo

1. Añade la regla en `public/css/custom.css`.
2. Usa variables existentes de `:root` si es posible.
3. No toques `layout.ejs` salvo que sea un asset global nuevo.

### 6.6 Migrar a SQL (Fase 2)

No implementar sin aprobación. El plan está en
`public/docs/06-plan-migracion-sql.md`. Reglas que no debes romper ahora:

- Sin embebidos ni arrays.
- Nombres de campo estables (`categoriaId` → `categoria_id`).
- Tipos planos.

---

## 7. Convenciones de código

| Elemento | Convención | Ejemplo |
|---|---|---|
| Modelo | `PascalCase.model.js` | `Producto.model.js` |
| Controller | `camelCaseController.js` | `productoController.js` |
| Router | `camelCaseRoutes.js` | `productoRoutes.js` |
| Vista | `carpeta/archivo.ejs` en minúsculas | `productos/list.ejs` |
| Variable/función | `camelCase` | `cargarCategorias` |
| Constante | `UPPER_SNAKE_CASE` | `PORT` |
| Mensajes | Español, con acentos, sin punto final en validaciones | `El precio es obligatorio` |
| Comillas | Simples en JS | `'texto'` |
| Indentación | 2 espacios | — |
| Punto y coma | Sí | — |

### 7.1 Patrón de controller

```js
exports.accion = async (req, res) => {
  try {
    // 1. leer/normalizar req
    // 2. llamar al modelo
    // 3. render o redirect
  } catch (error) {
    if (error.name === 'CastError') {
      return renderError(res, 404, 'Recurso no encontrado.');
    }

    console.error('Error al ...:', error);
    renderError(res, 500, 'No se pudo ...');
  }
};
```

### 7.2 Helpers existentes (reutilízalos)

| Helper | Archivo | Uso |
|---|---|---|
| `renderError(res, status, message)` | ambos controllers | Render centralizado de `error.ejs` |
| `primerMensajeValidacion(error)` | ambos controllers | Primer mensaje de `ValidationError` |
| `cargarCategorias()` | `productoController` | Categorías ordenadas y `.lean()` |
| `cargarCategoriasSeguras()` | ambos controllers | Igual, pero devuelve `[]` si falla |
| `construirPayload(body)` | `productoController` | Normalización de entrada |
| `escaparRegex(texto)` | `Producto.model.js` | Escape de metacaracteres |

No dupliques estos helpers; impórtalos o extráelos si hace falta.

---

## 8. Snippets canónicos

### 8.1 Listado con `.lean()` y `populate`

```js
const productos = await Producto.find(filtro)
  .populate('categoriaId', 'nombre')
  .sort({ nombre: 1 })
  .lean();
```

### 8.2 Update con validaciones

```js
const producto = await Producto.findByIdAndUpdate(id, payload, {
  returnDocument: 'after',
  runValidators: true,
});
```

### 8.3 Duplicado de categoría

```js
if (error.code === 11000) {
  return res.status(400).render('categorias/list', {
    title: 'Categorías',
    categorias: await cargarCategoriasSeguras(),
    error: 'Ya existe una categoría con ese nombre.',
    nombre,
  });
}
```

### 8.4 Validación de ObjectId en query

```js
if (categoriaId && !mongoose.Types.ObjectId.isValid(categoriaId)) {
  // render 400 con mensaje, no lanzar excepción
}
```

### 8.5 Formulario EJS sin layout duplicado

```ejs
<div class="row justify-content-center">
  <div class="col-lg-7">
    <h1 class="h3 mb-3"><%= editando ? 'Editar producto' : 'Nuevo producto' %></h1>
    <% if (typeof error !== 'undefined' && error) { %>
      <div class="alert alert-danger"><%= error %></div>
    <% } %>
    <!-- form -->
  </div>
</div>
```

---

## 9. Errores conocidos y prevención

| Error | Causa | Prevención |
|---|---|---|
| `CastError` | Id no es ObjectId válido | Capturar y devolver `404` |
| `11000` | `nombre` de categoría duplicado | Capturar y devolver `400` |
| `ValidationError` | `required`/`min` incumplido | Usar `primerMensajeValidacion` |
| Regex rota | Entrada con `(`, `*`, `+` | Usar `escaparRegex` |
| Update sin validar | `findByIdAndUpdate` sin opciones | `runValidators: true` |
| Documento Mongoose en vista | Falta `.lean()` | Añadir `.lean()` |
| Categoría sin nombre visible | Falta `populate` | `.populate('categoriaId', 'nombre')` |
| `nuevo` interpretado como id | Orden de rutas | Declarar `/nuevo` antes de `/:id` |
| Estilos inline | Se añadió `style=` | Mover a `custom.css` |
| 500 con detalles | `NODE_ENV` distinto de `production` | Ya controlado en `app.js` |
| Test falla en `before()` | Mongo no disponible | Iniciar MongoDB local |

---

## 10. Comandos y entorno

```bash
npm install        # instalar dependencias
npm run seed       # datos de ejemplo (idempotente, no en producción)
npm run dev        # nodemon
npm start          # node
npm test           # node --test tests/
```

Variables:

| Variable | Default | Uso |
|---|---|---|
| `PORT` | `3000` | Puerto HTTP |
| `MONGODB_URI` | — (obligatoria) | Conexión Mongo |
| `NODE_ENV` | `development` | `production` oculta errores; `test` en pruebas |

Base de test: `papeleria_test_<pid>_<timestamp>`, creada y eliminada por la
suite.

---

## 11. Definition of Done

Un cambio está terminado cuando:

- [ ] `npm test` pasa (con MongoDB local disponible).
- [ ] No se rompió ningún contrato de la sección 5.
- [ ] Los listados usan `.lean()`.
- [ ] No hay estilos inline ni `<style>`.
- [ ] No se añadieron dependencias no aprobadas.
- [ ] No se embebió categoría en producto ni se añadieron arrays.
- [ ] Los mensajes nuevos están en español y siguen el estilo existente.
- [ ] Se actualizaron `DOCUMENTACION-HUMANOS.md` y `DOCUMENTACION-IA.md` si
      cambió arquitectura, contrato, modelo o flujo.
- [ ] Se reportaron las inconsistencias encontradas.

---

## 12. Checklist antes de entregar

```
[ ] ¿Toqué solo las capas correctas?
[ ] ¿Añadí try/catch en cada handler nuevo?
[ ] ¿Manejo CastError, 11000 y ValidationError?
[ ] ¿Usé .lean() en listados?
[ ] ¿Escapé regex?
[ ] ¿El orden de rutas es correcto?
[ ] ¿La vista hija evita <html>/<head>/<body>?
[ ] ¿Todo el CSS está en custom.css?
[ ] ¿Actualicé los tests?
[ ] ¿Actualicé la documentación?
[ ] ¿Evité dependencias nuevas?
[ ] ¿Evité arrays/embebidos en Producto?
```

---

## 13. Decisiones registradas (ADR breves)

| # | Decisión | Motivo | Consecuencia |
|---|---|---|---|
| 1 | MongoDB + Mongoose en Fase 1 | Requisito académico del proyecto | Migración planificada a SQL |
| 2 | `categoriaId` referenciado, no embebido | Migración 1:1 a FK | Requiere `populate` |
| 3 | SSR con EJS + layouts | Simplicidad, sin build tools | Sin API JSON |
| 4 | Bootstrap por CDN | Evitar toolchain npm | Dependencia de red en runtime |
| 5 | Tema propio en `custom.css` | Control visual centralizado | Prohibido CSS inline |
| 6 | Borrado por `POST` | Formularios HTML simples | No es REST puro |
| 7 | Tests con `node --test` | Sin dependencias extra | Requiere Mongo real |
| 8 | Seed idempotente con `upsert` | Repetible sin duplicar | No borra datos existentes |
| 9 | `.lean()` obligatorio en listados | Rendimiento y objetos planos | Sin métodos de documento |
| 10 | Errores centralizados en `error.ejs` | Consistencia visual | Menos detalle por vista |

---

## 14. Trampas del repositorio

1. **`docs/` no existe**: la documentación está en `public/docs/`.
2. **`public/docs/` es público por HTTP**: no pongas secretos ahí.
3. **`proyeto parteb 1 de programacion.txt` está vacío**: ignóralo; no lo uses
   como fuente.
4. **`precio: 0` es válido**: no lo trates como ausente.
5. **`stock` vacío es `0`**, no error.
6. **El filtro de categoría inválido es 400, no 404.**
7. **El id inválido es 404, no 400.**
8. **`/productos/nuevo` depende del orden de rutas.**
9. **Los tests usan una DB real temporal**, no mocks.
10. **`public/docs/` no se modifica sin autorización humana.**

---

## 15. Plantilla de respuesta al terminar

```markdown
## Cambios
- <archivo>: <qué y por qué>

## Contratos afectados
- <ruta / esquema / mensaje>

## Verificación
- `npm test`: <resultado>
- Casos manuales: <lista>

## Riesgos / pendientes
- <si aplica>
```

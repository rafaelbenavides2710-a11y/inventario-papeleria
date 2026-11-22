# Inventario Papelería — Documentación para humanos

> Documento maestro del proyecto. Explica qué es, cómo se ejecuta, cómo está
> organizado cada archivo y por qué se tomaron las decisiones actuales.
>
> - Versión documentada: **Fase 1 (MongoDB + Mongoose)**.
> - Documento hermano para agentes de IA: [`DOCUMENTACION-IA.md`](DOCUMENTACION-IA.md).
> - Documentos temáticos originales: [`public/docs/`](public/docs/).

---

## Índice

1. [Qué es el proyecto](#1-qué-es-el-proyecto)
2. [Puesta en marcha](#2-puesta-en-marcha)
3. [Arquitectura MVC](#3-arquitectura-mvc)
4. [Mapa de carpetas y archivos](#4-mapa-de-carpetas-y-archivos)
5. [Modelo de datos](#5-modelo-de-datos)
6. [Contratos HTTP](#6-contratos-http)
7. [Vistas y UI](#7-vistas-y-ui)
8. [Reglas de negocio y validaciones](#8-reglas-de-negocio-y-validaciones)
9. [Seed de datos](#9-seed-de-datos)
10. [Pruebas automatizadas](#10-pruebas-automatizadas)
11. [El arnés del proyecto](#11-el-arnés-del-proyecto)
12. [Operación y troubleshooting](#12-operación-y-troubleshooting)
13. [Deuda técnica y observaciones](#13-deuda-técnica-y-observaciones)
14. [Glosario y roadmap Fase 2 SQL](#14-glosario-y-roadmap-fase-2-sql)

---

## 1. Qué es el proyecto

Aplicación web de **inventario de papelería** construida con **Node.js + Express +
EJS + Mongoose + MongoDB**, siguiendo un **MVC estricto**. Permite administrar dos
entidades:

- **Categorías**: nombre único.
- **Productos**: nombre, precio, stock y una categoría referenciada.

La interfaz es server-side rendering con **Bootstrap 5 vía CDN** y un tema oscuro
azul propio. No hay API JSON pública ni autenticación: es un CRUD de servidor
clásico que responde HTML.

### Qué incluye (Fase 1)

- CRUD completo de productos y categorías.
- Búsqueda parcial por nombre (case-insensitive) y filtro por categoría.
- Validaciones en el modelo Mongoose y en el controller.
- Borrado de categoría protegido si tiene productos asociados.
- Páginas de error 404 y 500.
- Seed idempotente con datos de ejemplo.
- Suite de pruebas con el runner nativo de Node.

### Qué NO incluye (fuera de alcance)

- Autenticación, autorización o sesiones.
- Protección CSRF (los formularios no envían token).
- API REST/JSON (todas las rutas renderizan vistas o redirigen).
- Paginación, ordenamiento configurable o exportación.
- Subida de archivos, imágenes o campos multimedia.
- Migración a SQL (es la Fase 2, solo planificada).

### Stack y versiones declaradas

| Componente | Versión declarada | Nota |
|---|---|---|
| Node.js | `>=20.19.0` | Requerido por `package.json` (`engines`) |
| Express | `^4.22.3` | Servidor HTTP |
| Mongoose | `^9.12.3` | ODM de MongoDB |
| EJS | `^3.1.10` | Motor de plantillas |
| express-ejs-layouts | `^2.5.1` | Layout automático |
| dotenv | `^18.0.10` | Carga de `.env` |
| nodemon | `^3.1.14` | Solo desarrollo |
| Bootstrap | `5.3.9` (CDN) | No se instala por npm |

> Las versiones son las declaradas en `package.json` / `package-lock.json`. El
> proyecto usa `"type": "commonjs"`, por lo que todos los archivos usan
> `require()` / `module.exports`.

---

## 2. Puesta en marcha

### 2.1 Requisitos

1. **Node.js 20.19 o superior** (`node -v`).
2. **MongoDB** accesible por URI. Por defecto se espera una instancia local en
   `mongodb://127.0.0.1:27017/papeleria`.
3. npm (incluido con Node).

### 2.2 Instalación

```bash
npm install
```

### 2.3 Variables de entorno

Copia `.env.example` a `.env` y ajusta si hace falta:

```dotenv
# Puerto del servidor
PORT=3000

# Conexión a MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/papeleria
```

- `.env` está en `.gitignore`: **nunca se sube**.
- Si `MONGODB_URI` falta, `src/config/db.js` lanza un error explícito y el
  servidor no arranca.

### 2.4 Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca con `nodemon` y recarga al guardar |
| `npm start` | Arranca con `node` (modo normal) |
| `npm run seed` | Carga categorías y productos de ejemplo (idempotente) |
| `npm test` | Ejecuta `node --test tests/` |

### 2.5 Primer arranque recomendado

```bash
npm install
npm run seed
npm run dev
```

Abrir `http://localhost:3000`. La raíz redirige a `/productos`.

> **Orden importante**: crea categorías antes de productos. El formulario de
> producto exige una categoría existente; si no hay ninguna, muestra el enlace
> para crearla.

---

## 3. Arquitectura MVC

### 3.1 Flujo de una petición

```
┌──────────┐   HTTP    ┌───────────────┐   llama   ┌────────────────┐
│ Cliente  │ ────────▶ │  Route        │ ────────▶ │  Controller    │
│ (naveg.) │           │ (express.Router)          │ (req/res)      │
└──────────┘           └───────────────┘           └───────┬────────┘
      ▲                                                    │ usa
      │ HTML                                               ▼
┌─────┴──────┐   render   ┌───────────────┐   consulta  ┌────────────────┐
│   View     │ ◀───────── │  Controller   │ ◀────────── │  Model         │
│   (EJS)    │            │  (datos)      │             │  (Mongoose)    │
└────────────┘            └───────────────┘             └───────┬────────┘
                                                                │
                                                         ┌──────▼──────┐
                                                         │  MongoDB    │
                                                         └─────────────┘
```

### 3.2 Responsabilidades por capa

| Capa | Archivo(s) | Responsabilidad | No debe hacer |
|---|---|---|---|
| Rutas | `src/routes/*.js` | Declarar método + path y delegar al controller | Lógica de negocio o consultas |
| Controllers | `src/controllers/*.js` | Leer `req`, validar entrada, llamar al modelo, renderizar o redirigir, manejar errores | Construir queries de Mongo directamente |
| Modelos | `src/models/*.js` | Definir esquema, validaciones, índices y métodos estáticos de consulta | Renderizar o conocer `req`/`res` |
| Vistas | `src/views/**/*.ejs` | Presentar datos y formularios | Acceder a la base de datos |
| Config | `src/config/db.js` | Conectar a MongoDB con `MONGODB_URI` | Contener lógica de negocio |
| Bootstrap app | `src/app.js` | Configurar Express, estáticos, rutas, 404 y 500 | Conectarse a Mongo |
| Entrada | `src/server.js` | Cargar `.env`, conectar y hacer `listen` | Definir rutas |

### 3.3 Regla de separación

Un controller **nunca** arma un filtro de MongoDB a mano. Para listados usa el
método estático del modelo (`Producto.buscar(...)`); para el resto usa los
métodos de Mongoose (`find`, `findById`, `create`, `findByIdAndUpdate`,
`findByIdAndDelete`).

---

## 4. Mapa de carpetas y archivos

### 4.1 Árbol completo

```
primera parte de proyecto programacion 3/
├── AGENTS.md                     # Reglas del arnés para agentes de IA
├── DOCUMENTACION-HUMANOS.md      # Este documento
├── DOCUMENTACION-IA.md           # Contrato operativo para agentes
├── opencode.json                 # Configuración de OpenCode (instrucciones)
├── package.json                  # Metadatos, scripts y dependencias
├── package-lock.json             # Árbol de dependencias bloqueado
├── .env                          # Variables locales (NO versionado)
├── .env.example                  # Plantilla de variables
├── .gitignore                    # Exclusiones de Git
├── proyeto parteb 1 de programacion.txt  # Archivo vacío (0 bytes)
├── node_modules/                 # Dependencias instaladas (NO versionado)
├── public/
│   ├── css/
│   │   └── custom.css            # Tema visual completo
│   └── docs/
│       ├── 01-arquitectura.md
│       ├── 02-estructura-carpetas.md
│       ├── 03-modelo-datos.md
│       ├── 04-contratos-api.md
│       ├── 05-convenciones.md
│       └── 06-plan-migracion-sql.md
├── scripts/
│   └── seed.js                   # Carga idempotente de datos de ejemplo
├── src/
│   ├── app.js                    # Configuración de Express
│   ├── server.js                 # Punto de entrada
│   ├── config/
│   │   └── db.js                 # Conexión a MongoDB
│   ├── models/
│   │   ├── Categoria.model.js
│   │   └── Producto.model.js
│   ├── controllers/
│   │   ├── categoriaController.js
│   │   └── productoController.js
│   ├── routes/
│   │   ├── categoriaRoutes.js
│   │   └── productoRoutes.js
│   └── views/
│       ├── layout.ejs
│       ├── error.ejs
│       ├── partials/
│       │   ├── header.ejs
│       │   └── footer.ejs
│       ├── productos/
│       │   ├── list.ejs
│       │   ├── form.ejs
│       │   └── detail.ejs
│       └── categorias/
│           ├── list.ejs
│           └── form.ejs
└── tests/
    └── app.test.js               # Suite de integración
```

### 4.2 Ficha por archivo

#### Raíz

| Archivo | Propósito | Cuándo tocarlo |
|---|---|---|
| `AGENTS.md` | Reglas resumidas para agentes de IA: stack, reglas de oro, comandos y prohibiciones. | Al cambiar reglas del proyecto o rutas de documentación. |
| `DOCUMENTACION-HUMANOS.md` | Este documento maestro. | Al cambiar arquitectura, rutas, modelo o flujo de trabajo. |
| `DOCUMENTACION-IA.md` | Contrato detallado y operativo para agentes. | Al cambiar invariantes, contratos o recetas. |
| `opencode.json` | Lista de documentos que OpenCode carga como instrucciones. | Al mover o añadir documentación. |
| `package.json` | Nombre, scripts, versión de Node y dependencias. | Solo con aprobación humana (nuevas dependencias). |
| `package-lock.json` | Resolución exacta de dependencias. | Se actualiza con npm; no editar a mano. |
| `.env` | Variables locales reales. | Nunca versionar. |
| `.env.example` | Plantilla pública de variables. | Al añadir una variable nueva. |
| `.gitignore` | Excluye `node_modules/`, `.env`, logs y basura del SO. | Al añadir artefactos nuevos. |
| `proyeto parteb 1 de programacion.txt` | Archivo vacío (0 bytes). Sin uso. | Candidato a eliminar (requiere confirmación). |

#### `public/`

| Ruta | Propósito | Regla |
|---|---|---|
| `public/css/custom.css` | Todo el estilo propio: fondo degradado, navbar, tarjetas, tablas, botones, formularios, alertas y scrollbar. | Es el **único** lugar para CSS propio. |
| `public/docs/*.md` | Documentación temática original (arquitectura, estructura, modelo, contratos, convenciones, migración SQL). | No modificar sin autorización humana. |

`public/` se sirve como estático desde `src/app.js` con
`express.static(path.join(__dirname, '..', 'public'))`. Por eso
`/css/custom.css` y `/docs/...` son accesibles por HTTP.

#### `scripts/`

| Archivo | Propósito |
|---|---|
| `scripts/seed.js` | Inserta 3 categorías y 5 productos de ejemplo usando `upsert` (idempotente). Bloquea su ejecución si `NODE_ENV=production`. Verifica integridad al final. |

#### `src/`

| Archivo | Propósito |
|---|---|
| `src/server.js` | Punto de entrada: carga `.env`, conecta a Mongo y hace `listen` en `PORT` (3000 por defecto). Si falla la conexión, sale con código 1. |
| `src/app.js` | Crea la app Express, configura EJS, layouts, estáticos, parseo de formularios/JSON, `appName`, rutas, 404 y manejador de errores. Exporta `app` (sin `listen`) para poder testearla. |
| `src/config/db.js` | Valida `MONGODB_URI`, conecta con `mongoose.connect` y devuelve la conexión. |
| `src/models/Categoria.model.js` | Esquema `Categoria`: `nombre` obligatorio, único, `trim`; `timestamps`. |
| `src/models/Producto.model.js` | Esquema `Producto` + método estático `buscar({ nombre, categoriaId })` con regex escapado, `populate`, orden y `.lean()`. |
| `src/controllers/categoriaController.js` | Listar, crear, editar, actualizar y eliminar categorías con validaciones y manejo de duplicados. |
| `src/controllers/productoController.js` | Listar con filtros, crear, ver detalle, editar, actualizar y eliminar productos. |
| `src/routes/categoriaRoutes.js` | Router de `/categorias`. |
| `src/routes/productoRoutes.js` | Router de `/productos`. |

#### `src/views/`

| Archivo | Propósito |
|---|---|
| `layout.ejs` | Documento HTML único: `<head>`, Bootstrap CDN, `custom.css`, header, `<%- body %>`, footer y bundle JS. Tema oscuro (`data-bs-theme="dark"`). |
| `partials/header.ejs` | Navbar con marca y enlaces a Productos/Categorías. |
| `partials/footer.ejs` | Pie con año dinámico. |
| `error.ejs` | Página de error genérica con código y mensaje. |
| `productos/list.ejs` | Tabla de productos + formulario de filtros + estados vacíos. |
| `productos/form.ejs` | Formulario compartido para crear/editar producto. |
| `productos/detail.ejs` | Ficha de producto con categoría, precio, stock y fechas. |
| `categorias/list.ejs` | Alta rápida de categoría + tabla con acciones. |
| `categorias/form.ejs` | Formulario de edición de categoría. |

#### `tests/`

| Archivo | Propósito |
|---|---|
| `tests/app.test.js` | Suite de integración con `node:test`. Levanta la app en un puerto efímero, usa una base temporal y cubre rutas, validaciones, índices, vistas y errores. |

#### `node_modules/`

Dependencias instaladas por npm. **No se versiona** (`.gitignore`). No editar ni
documentar su contenido; se regenera con `npm install`.

---

## 5. Modelo de datos

### 5.1 Diagrama entidad-relación

```
┌───────────────────────┐          ┌────────────────────────────┐
│      Categoria        │          │         Producto           │
├───────────────────────┤          ├────────────────────────────┤
│ _id: ObjectId (PK)    │◀────────┐│ _id: ObjectId (PK)         │
│ nombre: String unique │         └│ categoriaId: ObjectId (FK) │
│ createdAt: Date       │          │ nombre: String (index)     │
│ updatedAt: Date       │          │ precio: Number >= 0        │
└───────────────────────┘          │ stock: Number >= 0 (def 0) │
                                   │ createdAt / updatedAt      │
                                   └────────────────────────────┘
```

### 5.2 `Categoria`

| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | `ObjectId` | Generado por Mongo |
| `nombre` | `String` | `required`, `unique`, `trim` |
| `createdAt` | `Date` | `timestamps: true` |
| `updatedAt` | `Date` | `timestamps: true` |

Mensaje de validación literal:
`El nombre de la categoría es obligatorio`.

### 5.3 `Producto`

| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | `ObjectId` | Generado por Mongo |
| `nombre` | `String` | `required`, `trim`, `index: true` |
| `precio` | `Number` | `required`, `min: 0` |
| `stock` | `Number` | `required`, `min: 0`, `default: 0` |
| `categoriaId` | `ObjectId` | `ref: 'Categoria'`, `required`, `index: true` |
| `createdAt` | `Date` | `timestamps: true` |
| `updatedAt` | `Date` | `timestamps: true` |

Mensajes literales:

- `El nombre del producto es obligatorio`
- `El precio es obligatorio`
- `El precio no puede ser negativo`
- `El stock es obligatorio`
- `El stock no puede ser negativo`
- `La categoría es obligatoria`

### 5.4 Índices

| Colección | Índice | Motivo |
|---|---|---|
| `categorias` | `nombre` único | Evitar duplicados |
| `productos` | `nombre` B-tree | Ordenar y buscar por prefijo |
| `productos` | `categoriaId` | Filtrar por categoría |

**No** existe índice de texto (`_fts`) en Fase 1. La búsqueda usa regex sobre
`nombre` con `$options: 'i'`, no `$text`.

### 5.5 Regla de oro: referencia, no embebido

`Producto` guarda **solo** `categoriaId` (ObjectId + `ref`). Nunca se copia el
objeto categoría ni se usan arrays/subdocumentos dentro de `Producto`. Esto es lo
que permite que la Fase 2 (SQL) sea una migración 1:1 con una FK
`categoria_id`.

### 5.6 Método estático `Producto.buscar`

```js
productoSchema.statics.buscar = function ({ nombre, categoriaId } = {}) {
  const filtro = {};

  if (nombre) {
    filtro.nombre = { $regex: escaparRegex(nombre), $options: 'i' };
  }

  if (categoriaId) {
    filtro.categoriaId = categoriaId;
  }

  return this.find(filtro)
    .populate('categoriaId', 'nombre')
    .sort({ nombre: 1 })
    .lean();
};
```

Detalles importantes:

- `escaparRegex` neutraliza metacaracteres (`(`, `)`, `*`, `+`, etc.). Sin esto,
  una búsqueda como `(` rompería la consulta.
- `.lean()` devuelve objetos planos (más rápido para vistas).
- `.populate('categoriaId', 'nombre')` trae solo el nombre de la categoría.
- Orden alfabético ascendente por `nombre`.

---

## 6. Contratos HTTP

### 6.1 Raíz

| Método | Ruta | Acción | Respuesta |
|---|---|---|---|
| GET | `/` | Redirige al listado | `302` → `/productos` |

### 6.2 Productos

| Método | Ruta | Acción | Respuesta |
|---|---|---|---|
| GET | `/productos` | Listar con filtros | `200` + `productos/list.ejs` |
| GET | `/productos/nuevo` | Formulario de alta | `200` + `productos/form.ejs` |
| POST | `/productos` | Crear | `302` → `/productos` o `400` + form |
| GET | `/productos/:id` | Detalle | `200` + `productos/detail.ejs` |
| GET | `/productos/:id/editar` | Formulario de edición | `200` + `productos/form.ejs` |
| POST | `/productos/:id` | Actualizar | `302` → `/productos` o `400` + form |
| POST | `/productos/:id/eliminar` | Eliminar | `302` → `/productos` |

Query params de `GET /productos`:

- `nombre`: búsqueda parcial, case-insensitive.
- `categoria`: `_id` de categoría.
- Se pueden combinar.
- Si `categoria` no es un ObjectId válido → `400`, se renderiza el listado con
  el mensaje `El filtro de categoría no es válido.` y los filtros saneados.

> El orden de rutas importa: `/productos/nuevo` se declara **antes** de
> `/productos/:id` para que "nuevo" no se interprete como un id.

### 6.3 Categorías

| Método | Ruta | Acción | Respuesta |
|---|---|---|---|
| GET | `/categorias` | Listar | `200` + `categorias/list.ejs` |
| POST | `/categorias` | Crear | `302` → `/categorias` o `400` + list |
| GET | `/categorias/:id/editar` | Formulario de edición | `200` + `categorias/form.ejs` |
| POST | `/categorias/:id` | Actualizar | `302` → `/categorias` o `400` + form |
| POST | `/categorias/:id/eliminar` | Eliminar | `302` → `/categorias` o `400` + list |

Reglas específicas:

- Nombre duplicado → `400` con `Ya existe una categoría con ese nombre.`
- Nombre vacío → `400` con el mensaje de validación.
- Categoría con productos → `400` con
  `No se puede eliminar la categoría: tiene N producto(s) asociado(s).`

### 6.4 Errores

| Situación | Código | Render |
|---|---|---|
| Ruta inexistente | `404` | `error.ejs` con `La ruta solicitada no existe.` |
| Id malformado (`CastError`) | `404` | `error.ejs` con `... no encontrado.` |
| Id válido pero inexistente | `404` | `error.ejs` con `... no encontrado.` |
| Fallo inesperado | `500` | `error.ejs`; en producción no expone detalles |

### 6.5 Tabla resumen de códigos

| Código | Cuándo |
|---|---|
| `200` | Render correcto |
| `302` | Alta/edición/borrado exitoso (redirect) |
| `400` | Validación, duplicado, filtro inválido o borrado bloqueado |
| `404` | Ruta, id inválido o recurso inexistente |
| `500` | Excepción no controlada |

---

## 7. Vistas y UI

### 7.1 Composición

```
layout.ejs
├── <head>  → Bootstrap 5.3.9 CSS (CDN) + /css/custom.css
├── partials/header.ejs
├── <main> <%- body %>  ← vista hija inyectada
├── partials/footer.ejs
└── Bootstrap 5.3.9 JS bundle (CDN)
```

`express-ejs-layouts` está configurado en `app.js`:

```js
app.use(expressLayouts);
app.set('layout', 'layout');
```

Las vistas hijas **no** incluyen `<html>`, `<head>` ni `<body>`; solo el
contenido interno.

### 7.2 Tema visual

- Tema oscuro declarado con `<html lang="es" data-bs-theme="dark">`.
- Paleta definida con variables CSS en `:root` (`--papeleria-azul`,
  `--papeleria-negro`, etc.).
- Fondo con gradientes radiales + lineal fijo.
- Navbar, tarjetas, tablas, botones, formularios, alertas y scrollbar
  personalizados en `public/css/custom.css`.
- **Prohibido** usar `style="..."` o `<style>` en las vistas. Si se necesita un
  estilo nuevo, va en `custom.css`.

### 7.3 Reglas de las vistas

1. Cada vista hija se renderiza con `res.render('entidad/vista', datos)`.
2. Los datos siempre se pasan desde el controller; la vista no consulta Mongo.
3. Los formularios usan `POST` y `action` explícito (`formAction` en el caso de
   producto).
4. Los borrados usan `onsubmit="return confirm(...)"` para confirmación simple.
5. Los mensajes de error se muestran con `alert alert-danger` y se pasan como
   `error` desde el controller.
6. Los estados vacíos se manejan con `alert alert-info`.

### 7.4 Detalle de cada vista

| Vista | Datos que recibe | Particularidades |
|---|---|---|
| `productos/list.ejs` | `productos`, `categorias`, `filtros`, `error` | Formulario GET de filtros; dos estados vacíos distintos (sin datos vs. sin resultados). |
| `productos/form.ejs` | `producto`, `categorias`, `formAction`, `error` | Sirve para crear y editar según `producto._id`; avisa si no hay categorías. |
| `productos/detail.ejs` | `producto` | Muestra categoría poblada, precio con 2 decimales y fechas en formato `es`. |
| `categorias/list.ejs` | `categorias`, `error`, `nombre` | Alta rápida en la misma página + tabla. |
| `categorias/form.ejs` | `categoria`, `error` | Solo edición. |
| `error.ejs` | `status`, `message` | Botón de regreso a productos. |

---

## 8. Reglas de negocio y validaciones

### 8.1 Normalización de entrada

- `nombre` (categoría y producto): si no es string se usa `''`; luego `trim()`.
- `precio`: vacío/`undefined`/`null` → `null` (dispara `required`); si no,
  `Number(precio)`.
- `stock`: vacío/`undefined`/`null` → `0`; si no, `Number(stock)`.
- `categoriaId`: vacío → `null` (dispara `required`).

### 8.2 Casos límite documentados

| Caso | Comportamiento |
|---|---|
| `precio = 0` | **Válido** (solo se rechaza negativo o ausente). |
| `stock` vacío | Se guarda `0`. |
| `stock = 0` | Válido. |
| Nombre con espacios | Se recorta antes de validar. |
| Nombre duplicado de categoría | `400` por código Mongo `11000`. |
| Categoría con productos | No se elimina (`400`). |
| `categoriaId` inexistente pero con formato válido | Pasa la validación de tipo; no hay verificación de existencia en el controller. |
| Búsqueda con `(` u otro metacaracter | Se escapa; no rompe la regex. |
| `categoria` inválida en query | `400` + listado. |
| Id malformado en path | `CastError` → `404`. |

### 8.3 Manejo de errores en controllers

Patrón repetido:

```js
try {
  // operación
} catch (error) {
  if (error.name === 'CastError') return renderError(res, 404, '... no encontrado.');
  if (error.code === 11000) { /* duplicado */ }
  if (error.name === 'ValidationError') { /* primer mensaje */ }
  console.error('...', error);
  renderError(res, 500, '...');
}
```

- `primerMensajeValidacion(error)` devuelve el primer mensaje de
  `error.errors`, o `'Datos inválidos.'`.
- `renderError(res, status, message)` centraliza el render de `error.ejs`.
- `cargarCategoriasSeguras()` evita que un fallo al cargar categorías tumbe el
  formulario: devuelve `[]` y registra el error.

### 8.4 Actualizaciones

Se usa `findByIdAndUpdate(id, payload, { returnDocument: 'after', runValidators: true })`.
`runValidators` es imprescindible: sin él, Mongoose no aplica `required`/`min` en
updates.

---

## 9. Seed de datos

`scripts/seed.js`:

1. Carga `.env` con `dotenv`.
2. Si `NODE_ENV === 'production'`, aborta.
3. Conecta a Mongo.
4. Ejecuta `Categoria.init()` y `Producto.init()` para asegurar índices.
5. Inserta/actualiza categorías con `findOneAndUpdate` + `upsert` +
   `$setOnInsert`.
6. Inserta/actualiza productos de la misma forma, resolviendo `categoriaId`.
7. Verifica integridad: productos sin categoría o con precio/stock negativos.
8. Imprime totales y desconecta.

Datos cargados:

| Categorías | Productos |
|---|---|
| Cuadernos, Lápices, Papel | Cuaderno 100 hojas, Cuaderno universitario, Lápiz HB, Bolígrafo azul, Resma carta |

**Idempotencia**: ejecutar el seed varias veces no duplica datos; solo inserta lo
que falta (`$setOnInsert`).

---

## 10. Pruebas automatizadas

- Runner: `node --test` (nativo, sin frameworks externos).
- Archivo: `tests/app.test.js`.
- Requiere **MongoDB local** en `127.0.0.1:27017`.
- Crea una base temporal `papeleria_test_<pid>_<timestamp>` y la elimina en
  `after()`.
- Levanta la app con `app.listen(0)` (puerto efímero) y usa `fetch` con
  `redirect: 'manual'` para inspeccionar los `302`.

### Cobertura por bloques

| Bloque | Qué verifica |
|---|---|
| Índices | `unique` en categoría; índices en `nombre` y `categoriaId`; sin `_fts` |
| Raíz | Redirección a `/productos` |
| Categorías | Crear, duplicar, listar, nombre vacío, editar, actualizar, borrar vacía, bloquear con productos, 404 |
| Productos | Estado vacío, crear, listar, detalle, búsqueda, filtro, combinación, sin resultados, regex inválida, categoría inválida, editar, actualizar, validaciones, stock negativo, 404, borrar |
| Vistas | Un solo `<!DOCTYPE html>`, Bootstrap CDN, sin estilos inline, `appName` |
| Errores | 500 no filtra detalles internos; 404 de ruta inexistente |

### Ejecución

```bash
npm test
```

> Si MongoDB no está corriendo, la suite falla en `before()`. No hay mocks de
> base de datos.

---

## 11. El arnés del proyecto

El "arnés" es el conjunto de archivos que condicionan cómo trabajan los agentes
de IA y los humanos dentro del repo.

### 11.1 Componentes

| Archivo | Rol |
|---|---|
| `AGENTS.md` | Reglas resumidas y obligatorias (stack, modelo, vistas, comandos, prohibiciones). |
| `opencode.json` | Lista de documentos que OpenCode carga automáticamente como instrucciones. |
| `DOCUMENTACION-IA.md` | Contrato operativo detallado para agentes. |
| `.env.example` | Contrato de variables de entorno. |
| `package.json` | Contrato de scripts, Node y dependencias. |
| `tests/app.test.js` | Contrato ejecutable del comportamiento esperado. |

### 11.2 Flujo obligatorio antes de escribir código

1. Leer `public/docs/01-arquitectura.md`.
2. Según la tarea:
   - modelos → `public/docs/03-modelo-datos.md`
   - rutas/controllers → `public/docs/04-contratos-api.md`
   - vistas/estructura → `public/docs/02-estructura-carpetas.md`
   - convenciones → `public/docs/05-convenciones.md`
3. Si se modifica el modelo de datos, verificar
   `public/docs/06-plan-migracion-sql.md`.
4. Si hay ambigüedad, preguntar antes de asumir.

### 11.3 Prohibiciones del arnés

- No usar `find()` sin `.lean()` en listados.
- No modificar `public/docs/` sin autorización humana.
- No instalar dependencias fuera de las listadas en
  `public/docs/05-convenciones.md`.
- No cambiar el stack sin aprobación.
- No embeber categoría dentro de producto.

### 11.4 Nota de mantenimiento

La versión anterior de `AGENTS.md` y `opencode.json` apuntaba a `docs/...`, pero
los documentos reales viven en `public/docs/...`. Esta documentación deja el
arnés apuntando a la ruta correcta y añade `DOCUMENTACION-IA.md` como lectura
obligatoria.

---

## 12. Operación y troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| `MONGODB_URI no está definida` | Falta `.env` o la variable | Copiar `.env.example` a `.env` |
| `Error al conectar a MongoDB` | Mongo no está corriendo o URI incorrecta | Iniciar MongoDB / revisar URI |
| `EADDRINUSE` | Puerto 3000 ocupado | Cambiar `PORT` en `.env` |
| `npm test` falla en `before()` | No hay Mongo local | Iniciar MongoDB en `127.0.0.1:27017` |
| Página 500 genérica | `NODE_ENV=production` | Revisar logs del servidor (`console.error`) |
| 404 en `/productos/algo` | Id inválido o producto inexistente | Verificar el id |
| El formulario no guarda | Categoría faltante o validación | Revisar el mensaje `alert-danger` |
| No aparecen cambios de CSS | Caché del navegador | Recargar con `Ctrl+F5` |
| Los datos del seed no aparecen | URI apunta a otra base | Revisar `MONGODB_URI` |

### Verificación rápida

```bash
node -v                # >= 20.19
npm install
npm run seed
npm run dev
# abrir http://localhost:3000
```

---

## 13. Deuda técnica y observaciones

| # | Observación | Impacto | Recomendación |
|---|---|---|---|
| 1 | `AGENTS.md` y `opencode.json` apuntaban a `docs/`, inexistente | El arnés no cargaba las reglas | Corregido a `public/docs/` y se añadió `DOCUMENTACION-IA.md` |
| 2 | `proyeto parteb 1 de programacion.txt` está vacío (0 bytes) | Ruido en el repo | Eliminar con confirmación humana |
| 3 | Sin protección CSRF | Formularios vulnerables a envíos cruzados | Añadir token CSRF si se expone a internet |
| 4 | Sin autenticación/autorización | Cualquiera con acceso puede editar/borrar | Añadir auth antes de desplegar |
| 5 | Borrado por `POST` | No es semánticamente REST | Aceptable en SSR; documentar |
| 6 | No se valida que `categoriaId` exista | Se puede crear un producto con un ObjectId válido pero huérfano | Verificar `Categoria.exists()` en create/update |
| 7 | `public/docs/` se sirve públicamente | Los documentos son accesibles por HTTP | Mover a `docs/` si no deben publicarse |
| 8 | Versiones de dependencias muy nuevas | Posibles incompatibilidades futuras | Fijar versiones al congelar Fase 1 |
| 9 | Sin paginación | Listados crecen sin límite | Añadir `limit/skip` en Fase 2 |
| 10 | Sin logs estructurados | Difícil diagnosticar en producción | Introducir logger si se despliega |

---

## 14. Glosario y roadmap Fase 2 SQL

### 14.1 Glosario

| Término | Significado |
|---|---|
| **MVC** | Modelo-Vista-Controlador: separación de datos, presentación y control. |
| **ODM** | Object Document Mapper; aquí Mongoose. |
| **Lean** | Consulta que devuelve objetos planos en vez de documentos Mongoose. |
| **Populate** | Resolución de una referencia (`categoriaId`) a su documento. |
| **Upsert** | Insertar si no existe, actualizar si existe. |
| **CastError** | Error de Mongoose al convertir un valor a un tipo (p. ej. id inválido). |
| **11000** | Código de error de Mongo para clave duplicada. |
| **SSR** | Server-Side Rendering; el HTML se genera en el servidor con EJS. |
| **FK** | Foreign Key; referencia entre tablas en SQL. |

### 14.2 Roadmap Fase 2 (SQL)

El plan completo está en `public/docs/06-plan-migracion-sql.md`. Resumen:

```sql
CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  categoria_id INT NOT NULL REFERENCES categorias(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Estrategia:

1. `mongoexport` de `productos` y `categorias` a JSON.
2. Script de transformación:
   - `_id` → `id`
   - `categoriaId` → `categoria_id`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`
3. `COPY` o `INSERT` masivo en PostgreSQL/MySQL.

Condiciones que ya se cumplen para que la migración sea 1:1:

- `Producto` solo referencia la categoría (`categoriaId`), no la embebe.
- No hay arrays ni objetos anidados en `Producto`.
- Los campos son planos y los tipos mapean directo (`String`→`VARCHAR`,
  `Number`→`DECIMAL/INT`, `Date`→`TIMESTAMP`).

---

## Apéndice A — Mensajes literales del sistema

| Contexto | Mensaje |
|---|---|
| Categoría sin nombre | `El nombre de la categoría es obligatorio` |
| Categoría duplicada | `Ya existe una categoría con ese nombre.` |
| Categoría con productos | `No se puede eliminar la categoría: tiene N producto(s) asociado(s).` |
| Producto sin nombre | `El nombre del producto es obligatorio` |
| Producto sin precio | `El precio es obligatorio` |
| Precio negativo | `El precio no puede ser negativo` |
| Producto sin stock | `El stock es obligatorio` |
| Stock negativo | `El stock no puede ser negativo` |
| Producto sin categoría | `La categoría es obligatoria` |
| Filtro inválido | `El filtro de categoría no es válido.` |
| 404 genérico | `La ruta solicitada no existe.` |
| 500 producción | `Ocurrió un error inesperado.` |

## Apéndice B — Variables y constantes

| Nombre | Valor / origen |
|---|---|
| `PORT` | `.env`, por defecto `3000` |
| `MONGODB_URI` | `.env`, por defecto `mongodb://127.0.0.1:27017/papeleria` |
| `appName` | `Inventario Papelería` (`app.locals`) |
| `NODE_ENV` | `development` por defecto; `production` oculta detalles; `test` en pruebas |
| Bootstrap | `5.3.9` vía jsDelivr |
| DB de test | `papeleria_test_<pid>_<timestamp>` |

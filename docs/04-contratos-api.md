# Contratos de API (Rutas)

## Raíz

| Método | Ruta | Acción | Response |
|--------|------|--------|----------|
| GET | / | Redirigir al listado | Redirige a `/productos` |

## Productos

| Método | Ruta | Acción | Response |
|--------|------|--------|----------|
| GET | /productos | Listar productos | Renderiza `productos/list.ejs` |
| GET | /productos/nuevo | Formulario crear | Renderiza `productos/form.ejs` |
| POST | /productos | Crear producto | Redirige a `/productos` |
| GET | /productos/:id | Ver detalle | Renderiza `productos/detail.ejs` |
| GET | /productos/:id/editar | Formulario editar | Renderiza `productos/form.ejs` con datos |
| POST | /productos/:id | Actualizar producto | Redirige a `/productos` |
| POST | /productos/:id/eliminar | Eliminar producto | Redirige a `/productos` |

- `GET /productos` acepta filtros opcionales por query string:
  - `nombre`: búsqueda parcial por nombre, sin distinguir mayúsculas ni minúsculas.
  - `categoria`: `_id` de la categoría; muestra solo los productos de esa categoría.
  - Los filtros se pueden combinar (`/productos?nombre=cuaderno&categoria=<id>`).
  - Si `categoria` no es un `ObjectId` válido, responde 400 y muestra el mensaje en `productos/list.ejs`.

## Categorías

| Método | Ruta | Acción | Response |
|--------|------|--------|----------|
| GET | /categorias | Listar categorías | Renderiza `categorias/list.ejs` |
| POST | /categorias | Crear categoría | Redirige a `/categorias` |
| GET | /categorias/:id/editar | Formulario editar | Renderiza `categorias/form.ejs` con datos |
| POST | /categorias/:id | Actualizar categoría | Redirige a `/categorias` |
| POST | /categorias/:id/eliminar | Eliminar categoría | Redirige a `/categorias` |

- No se puede eliminar una categoría con productos asociados: responde 400 y muestra el mensaje en `categorias/list.ejs`.

## Errores

| Método | Ruta | Acción | Response |
|--------|------|--------|----------|
| GET | * (ruta no encontrada) | 404 | Renderiza `error.ejs` |

- 404: Renderizar `error.ejs` con un mensaje simple.
- 500: Capturar en controller con try/catch y pasar el mensaje a `error.ejs`.

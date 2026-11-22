# Convenciones de Código

## Nombres
- Archivos de modelo: `PascalCase.model.js` (ej. `Producto.model.js`).
- Archivos de controller/ruta: `camelCase.js` (ej. `productoController.js`).
- Variables y funciones: `camelCase`.
- Constantes: `UPPER_SNAKE_CASE`.

## Manejo de Errores
- Cada función de controller debe tener `try/catch`.
- En catch, renderizar una vista de error o redirigir con mensaje flash (si se implementa).
- No exponer stack traces en producción.

## Dependencias Permitidas
- `express`, `mongoose`, `ejs`, `dotenv`, `express-ejs-layouts`, `nodemon` (dev).
- Cualquier otra debe consultarse con el humano.

## Convenciones de Vistas
- Bootstrap 5 por CDN en `layout.ejs`, sin build tools ni instalación por npm.
- Cada vista hija se renderiza con `res.render('entidad/vista', datos)`.
- El layout se aplica automáticamente vía `express-ejs-layouts`; las vistas hijas solo contienen contenido interno (sin `<html>`, `<head>` ni `<body>`).
- Partials reutilizables en `views/partials/` (`header.ejs`, `footer.ejs`) mediante `include` desde `layout.ejs`.
- CSS propio únicamente en `public/css/custom.css`, servido como estático por `express.static`.
- Nada de estilos inline ni `<style>` dentro de las vistas; si se necesita algo, va en `custom.css`.

## Pruebas
- Runner nativo de Node: `node --test tests/`. No se añaden frameworks de test.

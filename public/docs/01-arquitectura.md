# Arquitectura MVC

## Flujo de una Petición
Request → Route → Controller → Model (Mongoose) → DB (MongoDB) → Controller → View (EJS) → Response.

## Responsabilidades
- **routes/**: Define endpoints HTTP. Solo enruta, no tiene lógica de negocio.
- **controllers/**: Recibe `req` y `res`. Valida entrada, llama al Model, renderiza la vista o redirige.
- **models/**: Define esquemas Mongoose con validaciones y tipos. Es la única capa que habla con MongoDB.
- **views/**: Plantillas EJS. Reciben datos del controller y generan HTML. No acceden a la base de datos.
- **app.js**: Configura Express (motor EJS, `express-ejs-layouts`, archivos estáticos, rutas y manejo de errores) y exporta la app.
- **server.js**: Carga las variables de entorno, conecta a MongoDB y levanta el servidor con `listen`.

## Regla de Separación
Un controller nunca debe construir una consulta de MongoDB directamente. Siempre usa métodos del Model.

# Estructura de Carpetas

papeleria-inventario/
├── AGENTS.md
├── opencode.json
├── package.json
├── .env.example
├── .gitignore
├── public/
│   └── css/
│       └── custom.css
├── scripts/
│   └── seed.js
├── src/
│   ├── models/
│   │   ├── Producto.model.js
│   │   └── Categoria.model.js
│   ├── controllers/
│   │   ├── productoController.js
│   │   └── categoriaController.js
│   ├── routes/
│   │   ├── productoRoutes.js
│   │   └── categoriaRoutes.js
│   ├── views/
│   │   ├── layout.ejs
│   │   ├── partials/
│   │   │   ├── header.ejs
│   │   │   └── footer.ejs
│   │   ├── error.ejs
│   │   ├── productos/
│   │   │   ├── list.ejs
│   │   │   ├── form.ejs
│   │   │   └── detail.ejs
│   │   └── categorias/
│   │       ├── list.ejs
│   │       └── form.ejs
│   ├── config/
│   │   └── db.js
│   ├── app.js
│   └── server.js
├── tests/
└── docs/

## Propósito de cada carpeta
- **models/**: Un archivo por entidad. Define el esquema Mongoose.
- **controllers/**: Un archivo por entidad. Agrupa las funciones de cada ruta.
- **routes/**: Un archivo por entidad. Exporta un `express.Router()`.
- **views/**: Un subdirectorio por entidad. El layout se aplica con `express-ejs-layouts`; las vistas hijas no repiten `<html>` ni `<body>`.
- **views/partials/**: Fragmentos reutilizables (`header.ejs`, `footer.ejs`) incluidos desde `layout.ejs` con `include`.
- **public/**: Archivos estáticos servidos por `express.static`. CSS propio solo en `public/css/custom.css`.
- **scripts/**: Scripts de mantenimiento. `seed.js` carga datos de ejemplo de forma idempotente y no se ejecuta en producción.
- **config/db.js**: Exporta una función que conecta a MongoDB usando `MONGODB_URI`.
- **app.js**: Configura Express (EJS, layouts, estáticos, rutas, manejo de errores) y exporta la app.
- **server.js**: Carga `.env`, conecta a la base de datos y hace `listen`.
- **tests/**: Pruebas ejecutadas con `node --test`.

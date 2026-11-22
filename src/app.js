const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');

const app = express();

// Motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Layouts (express-ejs-layouts)
app.use(expressLayouts);
app.set('layout', 'layout');

// Archivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));

// Parseo de formularios y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Datos disponibles en todas las vistas
app.locals.appName = 'Inventario Papelería';

// Raíz: redirige al listado de productos
app.get('/', (req, res) => {
  res.redirect('/productos');
});

// Rutas de la aplicación
app.use('/productos', require('./routes/productoRoutes'));
app.use('/categorias', require('./routes/categoriaRoutes'));

// 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Página no encontrada',
    status: 404,
    message: 'La ruta solicitada no existe.',
  });
});

// 500 - Error interno
app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).render('error', {
    title: 'Error del servidor',
    status: err.status || 500,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Ocurrió un error inesperado.'
        : err.message,
  });
});

module.exports = app;

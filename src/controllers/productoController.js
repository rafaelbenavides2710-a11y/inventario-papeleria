const mongoose = require('mongoose');
const Producto = require('../models/Producto.model');
const Categoria = require('../models/Categoria.model');

function renderError(res, status, message) {
  return res.status(status).render('error', {
    title: status === 404 ? 'No encontrado' : 'Error del servidor',
    status,
    message,
  });
}

function primerMensajeValidacion(error) {
  if (error.name === 'ValidationError') {
    const primero = Object.values(error.errors)[0];
    if (primero) {
      return primero.message;
    }
  }
  return 'Datos inválidos.';
}

async function cargarCategorias() {
  return Categoria.find().sort({ nombre: 1 }).lean();
}

async function cargarCategoriasSeguras() {
  try {
    return await cargarCategorias();
  } catch (error) {
    console.error('Error al cargar categorías:', error);
    return [];
  }
}

function construirPayload(body) {
  const { nombre, precio, stock, categoriaId } = body;

  return {
    nombre: typeof nombre === 'string' ? nombre.trim() : '',
    precio:
      precio === '' || precio === undefined || precio === null
        ? null
        : Number(precio),
    stock: stock === '' || stock === undefined || stock === null ? 0 : Number(stock),
    categoriaId: categoriaId || null,
  };
}

exports.list = async (req, res) => {
  const nombre =
    typeof req.query.nombre === 'string' ? req.query.nombre.trim() : '';
  const categoriaId =
    typeof req.query.categoria === 'string' ? req.query.categoria.trim() : '';

  try {
    if (categoriaId && !mongoose.Types.ObjectId.isValid(categoriaId)) {
      const [productos, categorias] = await Promise.all([
        Producto.buscar({ nombre }),
        cargarCategoriasSeguras(),
      ]);

      return res.status(400).render('productos/list', {
        title: 'Productos',
        productos,
        categorias,
        filtros: { nombre, categoriaId: '' },
        error: 'El filtro de categoría no es válido.',
      });
    }

    const [productos, categorias] = await Promise.all([
      Producto.buscar({ nombre, categoriaId }),
      cargarCategorias(),
    ]);

    res.render('productos/list', {
      title: 'Productos',
      productos,
      categorias,
      filtros: { nombre, categoriaId },
      error: null,
    });
  } catch (error) {
    console.error('Error al listar productos:', error);
    renderError(res, 500, 'No se pudieron cargar los productos.');
  }
};

exports.newForm = async (req, res) => {
  try {
    const categorias = await cargarCategorias();

    res.render('productos/form', {
      title: 'Nuevo producto',
      producto: null,
      categorias,
      formAction: '/productos',
      error: null,
    });
  } catch (error) {
    console.error('Error al mostrar el formulario:', error);
    renderError(res, 500, 'No se pudo mostrar el formulario.');
  }
};

exports.create = async (req, res) => {
  const payload = construirPayload(req.body);

  try {
    await Producto.create(payload);
    res.redirect('/productos');
  } catch (error) {
    if (error.name === 'ValidationError') {
      const categorias = await cargarCategoriasSeguras();

      return res.status(400).render('productos/form', {
        title: 'Nuevo producto',
        producto: payload,
        categorias,
        formAction: '/productos',
        error: primerMensajeValidacion(error),
      });
    }

    console.error('Error al crear producto:', error);
    renderError(res, 500, 'No se pudo crear el producto.');
  }
};

exports.detail = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('categoriaId', 'nombre')
      .lean();

    if (!producto) {
      return renderError(res, 404, 'Producto no encontrado.');
    }

    res.render('productos/detail', {
      title: producto.nombre,
      producto,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return renderError(res, 404, 'Producto no encontrado.');
    }

    console.error('Error al ver el producto:', error);
    renderError(res, 500, 'No se pudo cargar el producto.');
  }
};

exports.editForm = async (req, res) => {
  try {
    const [producto, categorias] = await Promise.all([
      Producto.findById(req.params.id).lean(),
      cargarCategorias(),
    ]);

    if (!producto) {
      return renderError(res, 404, 'Producto no encontrado.');
    }

    res.render('productos/form', {
      title: `Editar ${producto.nombre}`,
      producto,
      categorias,
      formAction: `/productos/${producto._id}`,
      error: null,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return renderError(res, 404, 'Producto no encontrado.');
    }

    console.error('Error al editar el producto:', error);
    renderError(res, 500, 'No se pudo cargar el formulario.');
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const payload = construirPayload(req.body);

  try {
    const producto = await Producto.findByIdAndUpdate(id, payload, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!producto) {
      return renderError(res, 404, 'Producto no encontrado.');
    }

    res.redirect('/productos');
  } catch (error) {
    if (error.name === 'CastError') {
      return renderError(res, 404, 'Producto no encontrado.');
    }

    if (error.name === 'ValidationError') {
      const categorias = await cargarCategoriasSeguras();

      return res.status(400).render('productos/form', {
        title: 'Editar producto',
        producto: { _id: id, ...payload },
        categorias,
        formAction: `/productos/${id}`,
        error: primerMensajeValidacion(error),
      });
    }

    console.error('Error al actualizar el producto:', error);
    renderError(res, 500, 'No se pudo actualizar el producto.');
  }
};

exports.destroy = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);

    if (!producto) {
      return renderError(res, 404, 'Producto no encontrado.');
    }

    res.redirect('/productos');
  } catch (error) {
    if (error.name === 'CastError') {
      return renderError(res, 404, 'Producto no encontrado.');
    }

    console.error('Error al eliminar el producto:', error);
    renderError(res, 500, 'No se pudo eliminar el producto.');
  }
};

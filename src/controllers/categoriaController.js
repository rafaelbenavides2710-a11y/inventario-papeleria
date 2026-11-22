const Categoria = require('../models/Categoria.model');
const Producto = require('../models/Producto.model');

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

async function cargarCategoriasSeguras() {
  try {
    return await Categoria.find().sort({ nombre: 1 }).lean();
  } catch (error) {
    console.error('Error al cargar categorías:', error);
    return [];
  }
}

exports.list = async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ nombre: 1 }).lean();

    res.render('categorias/list', {
      title: 'Categorías',
      categorias,
      error: null,
      nombre: '',
    });
  } catch (error) {
    console.error('Error al listar categorías:', error);
    renderError(res, 500, 'No se pudieron cargar las categorías.');
  }
};

exports.create = async (req, res) => {
  const nombre =
    typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';

  try {
    await Categoria.create({ nombre });
    res.redirect('/categorias');
  } catch (error) {
    if (error.code === 11000) {
      const categorias = await cargarCategoriasSeguras();

      return res.status(400).render('categorias/list', {
        title: 'Categorías',
        categorias,
        error: 'Ya existe una categoría con ese nombre.',
        nombre,
      });
    }

    if (error.name === 'ValidationError') {
      const categorias = await cargarCategoriasSeguras();

      return res.status(400).render('categorias/list', {
        title: 'Categorías',
        categorias,
        error: primerMensajeValidacion(error),
        nombre,
      });
    }

    console.error('Error al crear categoría:', error);
    renderError(res, 500, 'No se pudo crear la categoría.');
  }
};

exports.editForm = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id).lean();

    if (!categoria) {
      return renderError(res, 404, 'Categoría no encontrada.');
    }

    res.render('categorias/form', {
      title: `Editar ${categoria.nombre}`,
      categoria,
      error: null,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return renderError(res, 404, 'Categoría no encontrada.');
    }

    console.error('Error al editar la categoría:', error);
    renderError(res, 500, 'No se pudo cargar la categoría.');
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const nombre =
    typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';

  try {
    const categoria = await Categoria.findByIdAndUpdate(
      id,
      { nombre },
      { returnDocument: 'after', runValidators: true }
    );

    if (!categoria) {
      return renderError(res, 404, 'Categoría no encontrada.');
    }

    res.redirect('/categorias');
  } catch (error) {
    if (error.name === 'CastError') {
      return renderError(res, 404, 'Categoría no encontrada.');
    }

    if (error.code === 11000) {
      return res.status(400).render('categorias/form', {
        title: 'Editar categoría',
        categoria: { _id: id, nombre },
        error: 'Ya existe una categoría con ese nombre.',
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).render('categorias/form', {
        title: 'Editar categoría',
        categoria: { _id: id, nombre },
        error: primerMensajeValidacion(error),
      });
    }

    console.error('Error al actualizar la categoría:', error);
    renderError(res, 500, 'No se pudo actualizar la categoría.');
  }
};

exports.destroy = async (req, res) => {
  const { id } = req.params;

  try {
    const productos = await Producto.countDocuments({ categoriaId: id });

    if (productos > 0) {
      const categorias = await cargarCategoriasSeguras();

      return res.status(400).render('categorias/list', {
        title: 'Categorías',
        categorias,
        error: `No se puede eliminar la categoría: tiene ${productos} producto(s) asociado(s).`,
        nombre: '',
      });
    }

    const categoria = await Categoria.findByIdAndDelete(id);

    if (!categoria) {
      return renderError(res, 404, 'Categoría no encontrada.');
    }

    res.redirect('/categorias');
  } catch (error) {
    if (error.name === 'CastError') {
      return renderError(res, 404, 'Categoría no encontrada.');
    }

    console.error('Error al eliminar la categoría:', error);
    renderError(res, 500, 'No se pudo eliminar la categoría.');
  }
};

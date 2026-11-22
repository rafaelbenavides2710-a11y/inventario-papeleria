const mongoose = require('mongoose');

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
      index: true,
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    stock: {
      type: Number,
      required: [true, 'El stock es obligatorio'],
      min: [0, 'El stock no puede ser negativo'],
      default: 0,
    },
    categoriaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categoria',
      required: [true, 'La categoría es obligatoria'],
      index: true,
    },
  },
  { timestamps: true }
);

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

module.exports = mongoose.model('Producto', productoSchema);

require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Categoria = require('../src/models/Categoria.model');
const Producto = require('../src/models/Producto.model');

const CATEGORIAS = ['Cuadernos', 'Lápices', 'Papel'];

const PRODUCTOS = [
  { nombre: 'Cuaderno 100 hojas', precio: 12.5, stock: 25, categoria: 'Cuadernos' },
  { nombre: 'Cuaderno universitario', precio: 18.9, stock: 10, categoria: 'Cuadernos' },
  { nombre: 'Lápiz HB', precio: 1.2, stock: 100, categoria: 'Lápices' },
  { nombre: 'Bolígrafo azul', precio: 2.5, stock: 60, categoria: 'Lápices' },
  { nombre: 'Resma carta', precio: 22, stock: 15, categoria: 'Papel' },
];

async function cargarCategorias() {
  const ids = {};

  for (const nombre of CATEGORIAS) {
    const categoria = await Categoria.findOneAndUpdate(
      { nombre },
      { $setOnInsert: { nombre } },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );

    ids[nombre] = categoria._id;
  }

  return ids;
}

async function cargarProductos(ids) {
  for (const item of PRODUCTOS) {
    await Producto.findOneAndUpdate(
      { nombre: item.nombre },
      {
        $setOnInsert: {
          nombre: item.nombre,
          precio: item.precio,
          stock: item.stock,
          categoriaId: ids[item.categoria],
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );
  }
}

async function verificarIntegridad() {
  const sinCategoria = await Producto.countDocuments({
    categoriaId: { $exists: false },
  });

  const invalidos = await Producto.countDocuments({
    $or: [{ precio: { $lt: 0 } }, { stock: { $lt: 0 } }],
  });

  if (sinCategoria > 0 || invalidos > 0) {
    throw new Error(
      `Datos inconsistentes: ${sinCategoria} productos sin categoría y ${invalidos} con valores negativos`
    );
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed no se ejecuta en producción.');
  }

  await connectDB();

  try {
    await Promise.all([Categoria.init(), Producto.init()]);

    const ids = await cargarCategorias();
    await cargarProductos(ids);
    await verificarIntegridad();

    const totalCategorias = await Categoria.countDocuments();
    const totalProductos = await Producto.countDocuments();

    console.log(`Datos de ejemplo cargados en ${mongoose.connection.name}`);
    console.log(`Categorías: ${totalCategorias}`);
    console.log(`Productos: ${totalProductos}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('Error al cargar los datos de ejemplo:', error.message);
  process.exitCode = 1;
});

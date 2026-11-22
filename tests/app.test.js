const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');

const DB_NAME = `papeleria_test_${process.pid}_${Date.now()}`;

process.env.MONGODB_URI = `mongodb://127.0.0.1:27017/${DB_NAME}`;
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Categoria = require('../src/models/Categoria.model');
const Producto = require('../src/models/Producto.model');
const app = require('../src/app');

let server;
let base;
let categoria;

async function request(path, options = {}) {
  const res = await fetch(base + path, { redirect: 'manual', ...options });
  const text = await res.text();

  return {
    status: res.status,
    location: res.headers.get('location'),
    text,
  };
}

function form(data) {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data).toString(),
  };
}

async function crearProducto(datos) {
  const res = await request('/productos', form({
    stock: '1',
    categoriaId: String(categoria._id),
    ...datos,
  }));

  assert.equal(res.status, 302, `no se creó el producto: ${res.status}`);
  return Producto.findOne({ nombre: datos.nombre }).lean();
}

async function crearCategoria(nombre) {
  const existente = await Categoria.findOne({ nombre }).lean();

  if (existente) {
    return existente;
  }

  const res = await request('/categorias', form({ nombre }));
  assert.equal(res.status, 302, `no se creó la categoría ${nombre}`);

  const creada = await Categoria.findOne({ nombre }).lean();
  assert.ok(creada, `la categoría ${nombre} no se persistió`);
  return creada;
}

async function crearProductoEnCategoria(nombre, categoriaId) {
  const res = await request('/productos', form({
    nombre,
    precio: '1',
    stock: '1',
    categoriaId: String(categoriaId),
  }));

  assert.equal(res.status, 302, `no se creó el producto ${nombre}`);
  return Producto.findOne({ nombre }).lean();
}

before(async () => {
  await connectDB();
  await Promise.all([Categoria.init(), Producto.init()]);

  server = app.listen(0);
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;

  const res = await request('/categorias', form({ nombre: 'Cuadernos' }));
  assert.equal(res.status, 302, 'no se pudo preparar la categoría de prueba');

  categoria = await Categoria.findOne({ nombre: 'Cuadernos' }).lean();
  assert.ok(categoria, 'la categoría de prueba no se persistió');
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

test('índices de la fase 1', async () => {
  const indicesCategoria = await Categoria.collection.indexes();
  assert.ok(
    indicesCategoria.some((index) => index.key.nombre === 1 && index.unique === true),
    'falta el índice unique en categorias.nombre'
  );

  const indicesProducto = await Producto.collection.indexes();
  assert.ok(
    indicesProducto.some((index) => index.key.nombre === 1),
    'falta el índice en productos.nombre'
  );
  assert.ok(
    indicesProducto.some((index) => index.key.categoriaId === 1),
    'falta el índice en productos.categoriaId'
  );
  assert.ok(
    !indicesProducto.some((index) => index.key._fts),
    'no debe existir índice de texto en la fase 1'
  );
});

test('raíz: redirige al listado de productos', async () => {
  const res = await request('/');
  assert.equal(res.status, 302);
  assert.equal(res.location, '/productos');
});

test('categorías: crear, duplicar y listar', async () => {
  let res = await request('/categorias', form({ nombre: '  Lápices  ' }));
  assert.equal(res.status, 302);
  assert.equal(res.location, '/categorias');

  const creada = await Categoria.findOne({ nombre: 'Lápices' }).lean();
  assert.ok(creada, 'la categoría no se persistió');
  assert.ok(creada.createdAt && creada.updatedAt);

  res = await request('/categorias', form({ nombre: 'Cuadernos' }));
  assert.equal(res.status, 400);
  assert.match(res.text, /Ya existe una categoría con ese nombre/);
  assert.equal(await Categoria.countDocuments({ nombre: 'Cuadernos' }), 1);

  res = await request('/categorias');
  assert.equal(res.status, 200);
  assert.match(res.text, /Cuadernos/);
  assert.match(res.text, /Lápices/);
});

test('categorías: nombre vacío es rechazado', async () => {
  const res = await request('/categorias', form({ nombre: '   ' }));
  assert.equal(res.status, 400);
  assert.match(res.text, /El nombre de la categoría es obligatorio/);
  assert.equal(await Categoria.countDocuments({ nombre: '' }), 0);
});

test('categorías: editar y actualizar', async () => {
  let res = await request('/categorias', form({ nombre: 'Papelería' }));
  assert.equal(res.status, 302);

  const creada = await Categoria.findOne({ nombre: 'Papelería' }).lean();
  assert.ok(creada);

  res = await request(`/categorias/${creada._id}/editar`);
  assert.equal(res.status, 200);
  assert.match(res.text, /value="Papelería"/);
  assert.match(res.text, new RegExp(`action="/categorias/${creada._id}"`));

  res = await request(`/categorias/${creada._id}`, form({ nombre: 'Papelería fina' }));
  assert.equal(res.status, 302);

  const actualizada = await Categoria.findById(creada._id).lean();
  assert.equal(actualizada.nombre, 'Papelería fina');

  res = await request(`/categorias/${creada._id}`, form({ nombre: 'Cuadernos' }));
  assert.equal(res.status, 400);
  assert.match(res.text, /Ya existe una categoría con ese nombre/);

  res = await request(`/categorias/${creada._id}`, form({ nombre: '   ' }));
  assert.equal(res.status, 400);
  assert.match(res.text, /El nombre de la categoría es obligatorio/);
});

test('categorías: eliminar vacía y bloquear si tiene productos', async () => {
  await request('/categorias', form({ nombre: 'Categoría vacía' }));
  const vacia = await Categoria.findOne({ nombre: 'Categoría vacía' }).lean();
  assert.ok(vacia);

  let res = await request(`/categorias/${vacia._id}/eliminar`, { method: 'POST' });
  assert.equal(res.status, 302);
  assert.equal(await Categoria.findById(vacia._id).lean(), null);

  await request('/categorias', form({ nombre: 'Categoría con producto' }));
  const conProducto = await Categoria.findOne({ nombre: 'Categoría con producto' }).lean();
  assert.ok(conProducto);

  res = await request('/productos', form({
    nombre: 'Producto de categoría',
    precio: '1',
    stock: '1',
    categoriaId: String(conProducto._id),
  }));
  assert.equal(res.status, 302);

  res = await request(`/categorias/${conProducto._id}/eliminar`, { method: 'POST' });
  assert.equal(res.status, 400);
  assert.match(res.text, /No se puede eliminar la categoría/);
  assert.ok(await Categoria.findById(conProducto._id).lean());
  assert.equal(await Producto.countDocuments({ categoriaId: conProducto._id }), 1);
});

test('categorías: operaciones sobre inexistente devuelven 404', async () => {
  const id = '64b000000000000000000000';

  let res = await request(`/categorias/${id}/editar`);
  assert.equal(res.status, 404);
  assert.match(res.text, /Categoría no encontrada/);

  res = await request(`/categorias/${id}`, form({ nombre: 'X' }));
  assert.equal(res.status, 404);

  res = await request(`/categorias/${id}/eliminar`, { method: 'POST' });
  assert.equal(res.status, 404);

  res = await request('/categorias/no-es-un-id/editar');
  assert.equal(res.status, 404);

  res = await request('/categorias/no-es-un-id', form({ nombre: 'X' }));
  assert.equal(res.status, 404);
});

test('productos: estado vacío', async () => {
  await Producto.deleteMany({});

  const res = await request('/productos');
  assert.equal(res.status, 200);
  assert.match(res.text, /No hay productos registrados/);
});

test('productos: crear, listar y ver detalle', async () => {
  let res = await request('/productos/nuevo');
  assert.equal(res.status, 200);
  assert.match(res.text, /Cuadernos/);

  res = await request('/productos', form({
    nombre: '  Cuaderno 100 hojas  ',
    precio: '12.5',
    stock: '4',
    categoriaId: String(categoria._id),
  }));
  assert.equal(res.status, 302);
  assert.equal(res.location, '/productos');

  const producto = await Producto.findOne({ nombre: 'Cuaderno 100 hojas' }).lean();
  assert.ok(producto, 'el producto no se persistió');
  assert.equal(producto.precio, 12.5);
  assert.equal(producto.stock, 4);
  assert.ok(producto.categoriaId instanceof mongoose.Types.ObjectId);
  assert.equal(String(producto.categoriaId), String(categoria._id));
  assert.ok(producto.createdAt && producto.updatedAt);

  res = await request('/productos');
  assert.match(res.text, /Cuaderno 100 hojas/);
  assert.match(res.text, /Cuadernos/);
  assert.match(res.text, /\$ 12\.50/);

  res = await request(`/productos/${producto._id}`);
  assert.equal(res.status, 200);
  assert.match(res.text, /Cuaderno 100 hojas/);
  assert.match(res.text, /Cuadernos/);
});

test('productos: búsqueda por nombre y filtro por categoría', async () => {
  const categoriaA = await crearCategoria('Filtro A');
  const categoriaB = await crearCategoria('Filtro B');

  await crearProductoEnCategoria('Cuaderno filtro azul', categoriaA._id);
  await crearProductoEnCategoria('Cuaderno filtro rojo', categoriaB._id);
  await crearProductoEnCategoria('Lápiz filtro verde', categoriaB._id);

  let res = await request('/productos?nombre=FILTRO%20AZUL');
  assert.equal(res.status, 200);
  assert.match(res.text, /Cuaderno filtro azul/);
  assert.doesNotMatch(res.text, /Cuaderno filtro rojo/);
  assert.doesNotMatch(res.text, /Lápiz filtro verde/);

  res = await request(`/productos?categoria=${categoriaB._id}`);
  assert.equal(res.status, 200);
  assert.match(res.text, /Cuaderno filtro rojo/);
  assert.match(res.text, /Lápiz filtro verde/);
  assert.doesNotMatch(res.text, /Cuaderno filtro azul/);
  assert.match(res.text, new RegExp(`value="${categoriaB._id}"\\s+selected`));

  res = await request(`/productos?nombre=cuaderno&categoria=${categoriaB._id}`);
  assert.equal(res.status, 200);
  assert.match(res.text, /Cuaderno filtro rojo/);
  assert.doesNotMatch(res.text, /Lápiz filtro verde/);
  assert.doesNotMatch(res.text, /Cuaderno filtro azul/);

  res = await request('/productos?nombre=zzz-no-existe');
  assert.equal(res.status, 200);
  assert.match(res.text, /No se encontraron productos con esos filtros/);

  res = await request('/productos?nombre=%28');
  assert.equal(res.status, 200);
  assert.match(res.text, /No se encontraron productos con esos filtros/);

  res = await request('/productos?categoria=no-es-un-id');
  assert.equal(res.status, 400);
  assert.match(res.text, /El filtro de categoría no es válido/);
});

test('vistas: layout único y sin estilos inline', async () => {
  const res = await request('/productos');
  assert.equal((res.text.match(/<!DOCTYPE html>/g) || []).length, 1);
  assert.match(res.text, /bootstrap@5\.3\.9\/dist\/css\/bootstrap\.min\.css/);
  assert.doesNotMatch(res.text, /style=|<style/);
  assert.match(res.text, /Inventario Papelería/);
});

test('productos: editar, actualizar y validar', async () => {
  const producto = await crearProducto({ nombre: 'Producto para editar', precio: '5' });

  let res = await request(`/productos/${producto._id}/editar`);
  assert.equal(res.status, 200);
  assert.match(res.text, new RegExp(`action="/productos/${producto._id}"`));
  assert.match(res.text, /selected/);

  res = await request(`/productos/${producto._id}`, form({
    nombre: 'Producto editado',
    precio: '20',
    stock: '0',
    categoriaId: String(categoria._id),
  }));
  assert.equal(res.status, 302);

  const actualizado = await Producto.findById(producto._id).lean();
  assert.equal(actualizado.nombre, 'Producto editado');
  assert.equal(actualizado.precio, 20);
  assert.equal(actualizado.stock, 0);

  res = await request(`/productos/${producto._id}`, form({
    nombre: 'Producto editado',
    stock: '0',
    categoriaId: String(categoria._id),
  }));
  assert.equal(res.status, 400);
  assert.match(res.text, /El precio es obligatorio/);

  res = await request('/productos', form({
    nombre: 'Negativo',
    precio: '-1',
    stock: '1',
    categoriaId: String(categoria._id),
  }));
  assert.equal(res.status, 400);
  assert.match(res.text, /El precio no puede ser negativo/);
  assert.equal(await Producto.countDocuments({ nombre: 'Negativo' }), 0);

  res = await request('/productos', form({
    nombre: 'Sin categoría',
    precio: '1',
    stock: '1',
    categoriaId: '',
  }));
  assert.equal(res.status, 400);
  assert.match(res.text, /La categoría es obligatoria/);

  res = await request('/productos', form({
    nombre: 'Goma',
    precio: '0',
    stock: '1',
    categoriaId: String(categoria._id),
  }));
  assert.equal(res.status, 302);
  assert.equal(await Producto.countDocuments({ nombre: 'Goma', precio: 0 }), 1);
});

test('productos: stock negativo es rechazado', async () => {
  const res = await request('/productos', form({
    nombre: 'Stock negativo',
    precio: '1',
    stock: '-1',
    categoriaId: String(categoria._id),
  }));

  assert.equal(res.status, 400);
  assert.match(res.text, /El stock no puede ser negativo/);
  assert.equal(await Producto.countDocuments({ nombre: 'Stock negativo' }), 0);
});

test('productos: editar o eliminar inexistente devuelve 404', async () => {
  const id = '64b000000000000000000000';

  let res = await request(`/productos/${id}/editar`);
  assert.equal(res.status, 404);
  assert.match(res.text, /Producto no encontrado/);

  res = await request(`/productos/${id}/eliminar`, { method: 'POST' });
  assert.equal(res.status, 404);
  assert.match(res.text, /Producto no encontrado/);
});

test('errores 500 no filtran detalles internos', async () => {
  const findOriginal = Producto.find;
  const errorOriginal = console.error;

  Producto.find = () => {
    throw new Error('fallo simulado de base de datos');
  };
  console.error = () => {};

  let res;

  try {
    res = await request('/productos');
  } finally {
    Producto.find = findOriginal;
    console.error = errorOriginal;
  }

  assert.equal(res.status, 500);
  assert.match(res.text, /No se pudieron cargar los productos/);
  assert.doesNotMatch(res.text, /fallo simulado/);
  assert.equal((res.text.match(/<!DOCTYPE html>/g) || []).length, 1);
});

test('productos: eliminar y rutas no encontradas', async () => {
  const producto = await crearProducto({ nombre: 'Producto para borrar', precio: '3' });

  let res = await request(`/productos/${producto._id}/eliminar`, { method: 'POST' });
  assert.equal(res.status, 302);
  assert.equal(await Producto.findById(producto._id).lean(), null);

  res = await request(`/productos/${producto._id}`);
  assert.equal(res.status, 404);
  assert.match(res.text, /Producto no encontrado/);

  res = await request('/productos/no-es-un-id');
  assert.equal(res.status, 404);

  res = await request('/ruta-inexistente');
  assert.equal(res.status, 404);
  assert.match(res.text, /La ruta solicitada no existe/);
});

# Modelo de Datos (MongoDB con Mongoose)

## Esquema: Categoria
- `_id`: ObjectId (auto)
- `nombre`: String, required, unique, trim.
- `createdAt` / `updatedAt`: timestamps.

## Esquema: Producto
- `_id`: ObjectId (auto)
- `nombre`: String, required, trim, index: true.
- `precio`: Number, required, min: 0.
- `stock`: Number, required, min: 0, default: 0.
- `categoriaId`: ObjectId, ref: 'Categoria', required, index: true.
- `createdAt` / `updatedAt`: timestamps.

## Índices
- `Producto.nombre`: índice B-tree (`index: true`) para ordenar y buscar por prefijo.
- `Producto.categoriaId`: índice para filtros por categoría.
- No se usa índice de texto en Fase 1. Si se requiere búsqueda full-text, se añade con `Producto.schema.index({ nombre: 'text' })` y se documenta antes de implementarlo.

## Regla para Migración SQL
- `categoriaId` será una FOREIGN KEY en SQL. No embeber datos de categoría en Producto.
- No usar arrays ni subdocumentos dentro de Producto.

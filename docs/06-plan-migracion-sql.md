# Plan de Migración a SQL (Fase 2)

## Esquema SQL Futuro

```sql
CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  categoria_id INT NOT NULL REFERENCES categorias(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Reglas para que la Migración sea 1:1
- **No embeber**: `Producto` solo tiene `categoriaId`, nunca un objeto `categoria`.
- **Campos planos**: No usar arrays ni objetos anidados en `Producto`.
- **Mapeo de `_id`**: Los ObjectId se exportarán y transformarán a `SERIAL` en SQL (o UUID si se requiere).

## Estrategia de Migración
1. `mongoexport` de `productos` y `categorias` a JSON.
2. Script de transformación: renombrar `_id` → `id`, `categoriaId` → `categoria_id`, `createdAt` → `created_at`, etc.
3. `COPY` o `INSERT` masivo en PostgreSQL/MySQL.

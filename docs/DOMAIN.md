# Dominio: colección personal → catálogos de venta

## Modelo mental (3 capas)

```
Drive / Subida (fuente bruta)
        ↓ curas (solo lo que quieres usar)
Mi catálogo          ← colección personal (Design)
        ↓ armás colecciones comerciales
Catálogos de venta   ← lo que ve el vendedor (SalesCatalog)
```

| Capa | Entidad | Visibilidad |
|------|---------|-------------|
| Drive / Upload | — | Solo admin |
| **Mi catálogo** | `Design` | Solo admin |
| **Catálogos de venta** | `SalesCatalog` | Admin gestiona; vendedor ve `published` |

Un diseño en “Mi catálogo” **no** tiene `draft/published`. Se hace visible al vendedor al incluirlo en un catálogo de venta publicado.

## Entidades

### `Design` (colección personal)

Inventario curado. Si está aquí, es candidato para algún catálogo de venta.

Campos relevantes: metadata, previews, precios, taxonomías. **Sin** `status` de publicación.

### `SalesCatalog` (catálogo de venta)

```ts
{
  id: string;
  name: string;
  slug: string;           // único, URL pública
  description: string;
  status: "draft" | "published";
  designIds: string[];    // orden curado, many-to-many
  createdAt / updatedAt
}
```

- `draft` — solo admin
- `published` — visible en UI del vendedor (`/p/catalog`)

## Rutas admin

| Ruta | Rol |
|------|-----|
| `/laser`, `/3d`, `/amigurumis`, `/upload` | Incorporar diseños → Mi catálogo |
| `/catalog` | Mi catálogo: filtrar, seleccionar, agregar a catálogos de venta |
| `/catalog/[id]` | Editar un diseño de la colección |
| `/sales-catalogs` | CRUD de catálogos de venta |
| `/sales-catalogs/[id]` | Detalle / editar / quitar diseños |

## Rutas vendedor / públicas

| Ruta | Rol |
|------|-----|
| `/p/catalog` | Lista de catálogos `published` |
| `/p/catalog/[slug]` | Diseños de un catálogo publicado |
| `/p/design/[id]` | Detalle de diseño (solo si está en algún catálogo publicado) |

## APIs

| Método | Ruta | Auth |
|--------|------|------|
| GET/POST | `/api/sales-catalogs` | Público: solo `?status=published`. Admin: todos / crear |
| GET/PATCH/DELETE | `/api/sales-catalogs/[id]` | Público GET si published; resto admin |
| POST | `/api/sales-catalogs/add-designs` | Admin — `{ catalogIds, designIds }` |
| GET | `/api/designs` | Solo admin (toda la colección personal) |
| GET | `/api/designs/[id]` | Admin, o público si el diseño está en un catálogo publicado |

## Flujo operativo

1. En Drive/Upload → **Agregar a mi catálogo** (crea `Design`).
2. En **Mi catálogo** → seleccionar diseños → **Agregar a catálogo(s)** (busca/crea `SalesCatalog`, append idempotente de IDs).
3. En **Catálogos de venta** → editar nombre, status, quitar diseños, orden.
4. El vendedor abre `/p/catalog` y navega por catálogos publicados.

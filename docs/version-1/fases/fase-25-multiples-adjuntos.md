# Fase 24 — Múltiples Adjuntos por Campaña

## Objetivo

Permitir adjuntar **hasta 6 archivos** por campaña (actualmente solo 1). El cambio debe ser **mínimamente invasivo**: no romper nada que funcione hoy, ser retrocompatible con campañas existentes.

---

## Análisis del Estado Actual

### ¿Qué hay hoy?

| Capa | Campo actual | Descripción |
|---|---|---|
| DB (`campanas`) | `adjunto_url TEXT` | URL de 1 archivo |
| DB (`campanas`) | `adjunto_nombre_original TEXT` | Nombre visible de 1 archivo |
| Backend types | `adjunto_url: string \| null` | 1 string |
| Backend schema (Zod) | `adjunto_url: z.string().optional()` | 1 campo string |
| Backend routes | `upload.fields([..., { name: 'adjunto', maxCount: 1 }])` | 1 archivo |
| Backend controller | `files?.['adjunto']?.[0]` | Toma el primer archivo |
| Backend worker | `item.adjunto_url` → `attachments.push(...)` | 1 attachment |
| Frontend store | `adjunto: File \| null` | 1 File |
| Frontend `buildFormData` | `fd.append('adjunto', adjunto)` | 1 campo |
| Frontend UI | Botón toggle + nombre del archivo | 1 archivo |

### Estrategia elegida: Columna JSONB en campanas

**Agregar columna `adjuntos_extras JSONB`** en `campanas`.

- ✅ Sin migración de relaciones ni JOINs nuevos
- ✅ Retrocompatible: `adjunto_url` existente sigue funcionando en campañas viejas
- ✅ Cambio mínimo en el worker (solo iterar en lugar de un if)
- ✅ Compatible con el modelo actual del seed y tipos

---

## Archivos a Modificar (Solo los necesarios)

### 1. Base de datos — Migración SQL

```sql
-- Agregar columna de adjuntos múltiples (JSONB array)
-- Es retrocompatible: adjunto_url y adjunto_nombre_original se conservan
ALTER TABLE campanas 
ADD COLUMN IF NOT EXISTS adjuntos_extras JSONB DEFAULT '[]'::jsonb;

-- adjuntos_extras almacenará un array de objetos:
-- [{ "url": "/uploads/archivo.pdf", "nombre_original": "Bases.pdf" }, ...]
```

> **Nota:** La columna `adjunto_url` existente NO se elimina. Las campañas viejas siguen funcionando. Los adjuntos nuevos van en `adjuntos_extras`.

---

### 2. Backend — Types (`src/types/campana.ts`)

Agregar campo:

```typescript
adjuntos_extras: Array<{ url: string; nombre_original: string }> | null;
```

---

### 3. Backend — Schema Zod (`src/schemas/campanaSchema.ts`)

Agregar campo opcional (llega del FormData como string JSON):

```typescript
adjuntos_extras: z.preprocess((val) => {
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return Array.isArray(val) ? val : [];
}, z.array(z.object({
  url: z.string(),
  nombre_original: z.string()
})).optional().default([]))
```

---

### 4. Backend — Multer Routes (`src/routes/campanaRoutes.ts`)

Cambiar `maxCount: 1` a `maxCount: 6` y renombrar el campo a plural:

```typescript
// Antes:
upload.fields([{ name: 'flyer', maxCount: 1 }, { name: 'adjunto', maxCount: 1 }])

// Después:
upload.fields([{ name: 'flyer', maxCount: 1 }, { name: 'adjuntos', maxCount: 6 }])
```

---

### 5. Backend — Controller (`src/controllers/campanaController.ts`)

**Funciones `crear` y `actualizar`:**

```typescript
// Antes:
const adjuntoFile = files?.['adjunto']?.[0];
const adjunto_url = adjuntoFile ? `/uploads/${adjuntoFile.filename}` : (body.adjunto_url || null);

// Después:
const adjuntoFiles = files?.['adjuntos'] || [];
const adjuntos_extras = adjuntoFiles.map(f => ({
  url: `/uploads/${f.filename}`,
  nombre_original: f.originalname
}));
// Retrocompatibilidad: el primer adjunto también va en adjunto_url
const adjunto_url = adjuntos_extras[0]?.url || body.adjunto_url || null;
const adjunto_nombre_original = adjuntos_extras[0]?.nombre_original || null;
```

---

### 6. Backend — CampanaService (`src/services/campanaService.ts`)

Agregar `adjuntos_extras` al INSERT y al UPDATE dinámico:

```sql
-- En crearCampana:
INSERT INTO campanas (..., adjuntos_extras) VALUES (..., $N::jsonb)
-- value: JSON.stringify(adjuntos_extras)

-- En actualizarCampana: agregar al bloque dinámico de updates
```

---

### 7. Backend — Email Worker (`src/services/emailWorker.ts`)

**Query de lote** — agregar `adjuntos_extras`:

```sql
SELECT ce.id, ..., c.adjunto_url, c.adjuntos_extras, c.estado as campana_estado, ...
```

**Loop de envío:**

```typescript
// Adjunto legado (retrocompatibilidad)
if (item.adjunto_url) {
  const filepath = ...;
  if (fs.existsSync(filepath)) attachments.push({ filename, path: filepath });
}

// Adjuntos extras (nuevo, sin duplicar el primero si ya está en adjunto_url)
const extras: Array<{url: string; nombre_original: string}> = item.adjuntos_extras || [];
for (const adj of extras) {
  if (adj.url === item.adjunto_url) continue; // ya fue procesado arriba
  const cleanPath = adj.url.startsWith('/') ? adj.url.slice(1) : adj.url;
  const filepath = path.resolve(process.cwd(), cleanPath);
  if (fs.existsSync(filepath)) {
    attachments.push({ filename: adj.nombre_original, path: filepath });
  }
}
```

---

### 8. Frontend — Types (`client/src/types/campana.ts`)

Agregar al tipo `Campana` y a `CampanaFormData`:

```typescript
adjuntos_extras: Array<{ url: string; nombre_original: string }> | null;
```

---

### 9. Frontend — Store (`client/src/stores/campanaStore.ts`)

**Estado actual → nuevo:**

```typescript
// Antes:
adjunto: File | null;
adjuntoName: string | null;

// Después:
adjuntos: File[];
adjuntosNames: string[];
```

**buildFormData:**

```typescript
// Antes:
if (adjunto) fd.append('adjunto', adjunto);

// Después:
adjuntos.forEach(file => fd.append('adjuntos', file));
if (form.adjuntos_extras?.length) {
  fd.append('adjuntos_extras', JSON.stringify(form.adjuntos_extras));
}
```

---

### 10. Frontend — CrearCampana.tsx

Reemplazar la sección del adjunto único:

- `<input multiple accept="...">` para seleccionar múltiples archivos
- Lista de archivos seleccionados con botón ❌ para quitar cada uno
- Contador "X/6 archivos" con indicador visual
- Al editar un borrador: mostrar `form.adjuntos_extras` como archivos previos
- Toggle `conAdjunto` se mantiene igual (muestra/oculta la sección)

---

### 11. Frontend — VistaPrevia.tsx

Mostrar lista de adjuntos:

```tsx
// Antes: una línea con el nombre del adjunto único
// Después: <ul> con cada adjunto de adjuntosNames o form.adjuntos_extras
```

---

## Orden de Implementación

| # | Archivo | Tipo de cambio |
|---|---|---|
| 1 | Migración SQL | ADD COLUMN adjuntos_extras JSONB |
| 2 | `src/types/campana.ts` | +campo adjuntos_extras |
| 3 | `src/schemas/campanaSchema.ts` | +campo Zod |
| 4 | `src/routes/campanaRoutes.ts` | maxCount 1→6, adjunto→adjuntos |
| 5 | `src/controllers/campanaController.ts` | crear + actualizar + enviarPrueba |
| 6 | `src/services/campanaService.ts` | crearCampana + actualizarCampana |
| 7 | `src/services/emailWorker.ts` | query + loop attachments |
| 8 | `client/src/types/campana.ts` | +campo adjuntos_extras |
| 9 | `client/src/stores/campanaStore.ts` | adjunto→adjuntos array + buildFormData |
| 10 | `client/src/components/CrearCampana.tsx` | UI multi-adjunto |
| 11 | `client/src/components/VistaPrevia.tsx` | lista de adjuntos |

---

## Retrocompatibilidad garantizada

| Caso | Comportamiento |
|---|---|
| Campaña vieja con `adjunto_url` | Worker la sigue leyendo como antes |
| Campaña nueva con 1 adjunto | Va en `adjuntos_extras[0]` y en `adjunto_url` |
| Campaña nueva con N adjuntos | Todos van en `adjuntos_extras`, el primero también en `adjunto_url` |
| Campaña sin adjuntos | Funciona igual que hoy |

---

## Restricciones / Casos Borde

- **Límite configurable:** Por defecto 6 archivos, configurable dinámicamente mediante las variables de entorno `MAX_ADJUNTOS` (backend) y `VITE_MAX_ADJUNTOS` (frontend). El backend expone `/api/campanas/config` para sincronizar en tiempo real.
- **Multer:** Fuerza el límite con `maxCount: config.maxAdjuntos`.
- **Tamaño:** Se mantiene el límite actual de 10 MB por archivo (multerConfig sin cambios).
- **Sin tocar:** Flyer, tracking, cola de envíos, estadísticas, soporte, seed, otras pantallas.
- **Al editar borrador:** Si no se suben archivos nuevos, `adjuntos_extras` se pasa como JSON string para preservar los existentes.

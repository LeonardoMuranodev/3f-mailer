# SOP: Filtro "Sin Rubro" en Directorio de Contactos y Listado de Campañas

## Objetivo
Permitir a los usuarios filtrar y listar de manera explícita contactos y campañas asociados a la condición "Sin Rubro" (contactos que no poseen rubro asignado o campañas que los incluyan como destinatarios).

---

## 1. Definición y Convenciones
- El identificador estándar para la ausencia de rubro en selectores y consultas es `__sin_rubro__`.
- En contactos: Representa registros donde `c.rubro_id IS NULL OR TRIM(c.rubro_id) = '' OR c.rubro_id = 'null'`.
- En campañas: Representa campañas que tienen `para_todos_rubros = true` (ya que alcanzan a todos los contactos, incluyendo sin rubro) o aquellas que tienen explícitamente `'__sin_rubro__'` en su array JSON `rubros_seleccionados`.

---

## 2. Lógica de Frontend

### A. Directorio de Contactos (`DirectorioContactos.tsx`)
- En el dropdown de búsqueda por rubro (`<select value={rubroId}>`):
  - Añadir la opción `<option value="__sin_rubro__">Sin Rubro</option>` inmediatamente después de `"Todos los rubros"`.
  - Al seleccionar esta opción, el estado `rubroId` toma el valor `'__sin_rubro__'` y envía dicho parámetro a `obtenerContactos({ rubro_id: '__sin_rubro__' })`.

### B. Listado de Campañas (`ListaCampanas.tsx`)
- En el dropdown de búsqueda por rubro (`<select value={rubro}>`):
  - Añadir la opción `<option value="__sin_rubro__">Sin Rubro</option>` inmediatamente después de `"Todos los rubros"`.
  - Al seleccionar esta opción, el estado `rubro` toma el valor `'__sin_rubro__'` y envía dicho parámetro a `listarCampanas({ rubro: '__sin_rubro__' })`.

### C. Diccionario de Rubros (`client/src/data/rubros.ts`)
- Añadir en `RUBROS_LABELS`:
  `__sin_rubro__: 'Sin Rubro'` para que cualquier componente que formatee el valor muestre la etiqueta legible.

---

## 3. Lógica de Backend

### A. Servicio de Contactos (`src/services/contactoService.ts`)
- En `listarContactos`:
  - Si `rubro_id === '__sin_rubro__'` o normalizaciones equivalentes (`'sin rubro'`, `'sin_rubro'`):
    - Agregar a `conditions`: `(c.rubro_id IS NULL OR TRIM(c.rubro_id) = '' OR c.rubro_id = 'null')`.
    - No agregar parámetros posicionales extras a `values` para esta condición.
  - Para cualquier otro valor, mantener el filtro existente por ID/nombre.

### B. Servicio de Campañas (`src/services/campanaService.ts`)
- En `listarCampanas`:
  - Si `filtros.rubro === '__sin_rubro__'` o normalizaciones equivalentes:
    - Agregar a `conditions`: `(para_todos_rubros = true OR rubros_seleccionados::jsonb ? '__sin_rubro__')`.
  - Para cualquier otro valor, mantener el filtro existente: `(para_todos_rubros = true OR rubros_seleccionados::jsonb ? $paramIdx)`.

---

## 4. Criterios de Aceptación
1. En `Directorio de Contactos`, al seleccionar "Sin Rubro" en el filtro y hacer clic en "Aplicar", se listan únicamente los contactos sin rubro (`rubro_id IS NULL` o vacío).
2. En `Listado de Campañas`, al seleccionar "Sin Rubro" en el filtro y presionar Buscar, se muestran las campañas que aplican a contactos sin rubro (`para_todos_rubros = true` o que seleccionaron `__sin_rubro__`).
3. Ambos selectores permiten restablecer a "Todos los rubros" sin efectos secundarios.

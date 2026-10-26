### 📋 Plan de Implementación

**Fase 1: Base de Datos y Tipos**
1. **Crear una Migración SQL (`015_add_links_nacion_provincia.sql`):** 
   - Agregar a la tabla `campanas` las columnas `link_nacion` (text) y `link_provincia` (text).
2. **Actualizar TypeScript y Zod:**
   - En Frontend y Backend (`src/types/campana.ts`, `src/schemas/campanaSchema.ts`), agregar ambos campos como URIs opcionales (o strings vacíos).

**Fase 2: Adaptación del Backend (`campanaController` y `campanaService`)**
1. Actualizar las funciones de `crearCampana` y `actualizarCampana` para que inserten/editen `link_nacion` y `link_provincia` en la base de datos junto con el resto de la data.
2. Actualizar el worker (`emailWorker.ts`) para que, al traer la campaña de la cola, haga un `SELECT` de estos dos campos y se los pase al constructor del HTML.

**Fase 3: Formulario Frontend (`CrearCampana.tsx` & `campanaStore.ts`)**
1. Añadir los campos al store de Zustand y al `FormData`.
2. En la UI de **Crear Campaña**, modificar el bloque del "Link de Inscripción":
   - Colocar un Toggle/Switch que pregunte: **"¿Usar inscripción múltiple (Nación/Provincia)?"**
   - **Si está apagado (por defecto):** Muestra el input genérico que ya existe hoy (Link único naranja).
   - **Si está encendido:** Oculta el input genérico y despliega dos inputs independientes: "Link Nación" y "Link Provincia".

**Fase 4: Maquetación del Mail (`emailTemplate.ts` y `VistaPrevia.tsx`)**
1. **Modificar `emailTemplate.ts`**:
   - Evaluar si vienen los campos `link_nacion` y/o `link_provincia`.
   - Si existen, en lugar del botón único, renderizar un contendor centrado con los botones en paralelo (o apilados en mobile):
     - **Botón Nación:** Fondo color Celeste Institucional (`#75AADB` o el tono exacto) y texto Blanco.
     - **Botón Provincia:** Fondo color Verde Institucional (`#2E8B57` o el tono exacto) y texto Blanco.
   - Si no existen (y solo hay `link_inscripcion`), dejar el botón Naranja como está ahora.
2. **Actualizar la Vista Previa**: Replicar la misma lógica visual en `VistaPrevia.tsx` para que las encargadas vean ambos botones al maquetar.
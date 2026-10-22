# Plan de Implementación: Múltiples Adjuntos en Campañas

## 1. Contexto y Requerimiento
Actualmente el sistema soporta un único archivo adjunto por campaña mediante las columnas `adjunto_url` y `adjunto_nombre_original`. El área de producción municipal requiere enviar **múltiples archivos adjuntos** (por ejemplo: un PDF de bases + un Excel de formulario + una imagen de cronograma) en una misma campaña.

---

## 2. Arquitectura de Datos y Retrocompatibilidad

### Base de Datos PostgreSQL
* **Estrategia:** Añadir una columna `adjuntos` de tipo `JSONB` a la tabla `campanas`.
* **Estructura del elemento:**
  ```json
  [
    {
      "url": "/uploads/adjunto-1790688464566-733732036.pdf",
      "nombre_original": "Bases_y_Condiciones_2026.pdf",
      "tamano": 1048576,
      "mimetype": "application/pdf"
    },
    {
      "url": "/uploads/adjunto-1790688562111-912837462.xlsx",
      "nombre_original": "Planilla_Inscripcion.xlsx",
      "tamano": 524288,
      "mimetype": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  ]
  ```
* **Migración SQL (`018_add_adjuntos_multiples.sql`):**
  1. `ALTER TABLE campanas ADD COLUMN IF NOT EXISTS adjuntos JSONB DEFAULT '[]'::jsonb;`
  2. Migración automática de campañas existentes: convierte `adjunto_url` y `adjunto_nombre_original` al array `adjuntos`.
  3. Mantiene vivas las columnas anteriores con el primer archivo para compatibilidad retroactiva 100%.

---

## 3. Capas a Modificar

```mermaid
graph TD
    UI[Frontend: CrearCampana / VistaPrevia] -->|FormData: flyer + adjuntos múltiples| Multer[Multer: upload.fields adjuntos maxCount 5]
    Multer --> Zod[Middleware: validateSchema Zod]
    Zod --> Controller[campanaController: procesar req.files.adjuntos]
    Controller --> Service[campanaService: persistir JSONB en DB]
    Service --> Worker[emailWorker: leer disco y armar attachments[] en Nodemailer]
    Worker --> SMTP[SMTP Gmail / Outlook: Entrega con archivos reales]
```

### A. Backend API & Multer
1. **[multerConfig.ts](file:///c:/Users/Tecno3F/mails-app/src/config/multerConfig.ts):**
   - Asegurar que `prefix = 'adjunto'` se mantenga tanto para `adjunto` como para `adjuntos`.
   - Limitar tamaño individual a 10 MB (con un máximo combinado recomendado de 20 MB para cumplir el límite SMTP de 25 MB).
2. **[campanaRoutes.ts](file:///c:/Users/Tecno3F/mails-app/src/routes/campanaRoutes.ts):**
   - Actualizar `upload.fields([{ name: 'flyer', maxCount: 1 }, { name: 'adjuntos', maxCount: 5 }, { name: 'adjunto', maxCount: 1 }])`.
3. **[campanaSchema.ts](file:///c:/Users/Tecno3F/mails-app/src/schemas/campanaSchema.ts):**
   - Definir esquema para `adjuntos` en Zod (soporta string serializado en multipart o array).
4. **[campanaController.ts](file:///c:/Users/Tecno3F/mails-app/src/controllers/campanaController.ts):**
   - En `crear`, `actualizar` y `enviarPrueba`: mapear `req.files['adjuntos']` extrayendo `filename`, `originalname`, `size`, `mimetype`.
5. **[campanaService.ts](file:///c:/Users/Tecno3F/mails-app/src/services/campanaService.ts):**
   - Guardar `adjuntos` como JSONB. Poblar `adjunto_url = adjuntos[0]?.url` como fallback.

### B. Worker de Envíos Masivos
1. **[emailWorker.ts](file:///c:/Users/Tecno3F/mails-app/src/services/emailWorker.ts):**
   - Incluir `c.adjuntos` en la consulta `SELECT` del lote pendiente.
   - Iterar sobre la lista de adjuntos, resolver rutas locales en `/uploads` y añadirlos al array `attachments` de Nodemailer con su `nombre_original`.

### C. Frontend (UI/UX)
1. **Tipos ([campana.ts](file:///c:/Users/Tecno3F/mails-app/client/src/types/campana.ts)):**
   - Definir interfaz `CampanaAdjunto { url: string; nombre_original: string; tamano?: number; mimetype?: string; }`.
   - Agregar `adjuntos?: CampanaAdjunto[]` a `Campana` y `CampanaFormData`.
2. **Store ([campanaStore.ts](file:///c:/Users/Tecno3F/mails-app/client/src/stores/campanaStore.ts)):**
   - Manejar array `adjuntos: File[]` y `adjuntosExistentes: CampanaAdjunto[]`.
   - Métodos para agregar archivos (`addAdjuntos(files: File[])`) y eliminar uno puntual (`removeAdjunto(index)`).
   - `buildFormData`: hacer append de cada archivo en `fd.append('adjuntos', file)`.
3. **Componente [CrearCampana.tsx](file:///c:/Users/Tecno3F/mails-app/client/src/components/CrearCampana.tsx):**
   - Selector múltiple de archivos (`<input type="file" multiple />`).
   - Lista visual de archivos adjuntados con tarjeta individual:
     - Icono según extensión (.pdf, .xlsx, .docx, imagen).
     - Nombre original del archivo.
     - Tamaño formateado (KB/MB).
     - Botón de eliminar (tacho/cruz) para quitar archivos antes de enviar.
     - Contador y acumulador de peso total (ej. *"3 archivos adjuntos • 4.2 MB de 20 MB máx"*).
4. **Componentes [VistaPrevia.tsx](file:///c:/Users/Tecno3F/mails-app/client/src/components/VistaPrevia.tsx) y [DetalleCampana.tsx](file:///c:/Users/Tecno3F/mails-app/client/src/components/DetalleCampana.tsx):**
   - Mostrar la lista de todos los archivos que viajarán adjuntos con opción de descarga/inspección.

---

## 4. Plan de Ejecución Paso a Paso

| Paso | Tarea | Archivos Involucrados |
| :--- | :--- | :--- |
| **Paso 1** | Migración de base de datos (`JSONB`) | `src/migrations/018_add_adjuntos_multiples.sql` |
| **Paso 2** | Modelos TypeScript y esquemas Zod | `src/types/campana.ts`, `src/schemas/campanaSchema.ts` |
| **Paso 3** | Multer y Controlador de Campañas | `src/routes/campanaRoutes.ts`, `src/controllers/campanaController.ts`, `src/services/campanaService.ts` |
| **Paso 4** | Integración en Worker de Emails | `src/services/emailWorker.ts` |
| **Paso 5** | Store Zustand y Helper FormData | `client/src/types/campana.ts`, `client/src/stores/campanaStore.ts` |
| **Paso 6** | UI Crear Campaña (Listado y chips de archivos) | `client/src/components/CrearCampana.tsx` |
| **Paso 7** | UI Vista Previa y Detalle | `client/src/components/VistaPrevia.tsx`, `client/src/components/DetalleCampana.tsx` |
| **Paso 8** | Validación y prueba de envío real con 3 archivos | Test con Mailpit / SMTP |

---

## 5. Criterios de Aceptación
1. Poder seleccionar y subir de 1 a 5 archivos simultáneamente al crear o editar una campaña.
2. Poder eliminar cualquier archivo de la lista antes de enviar.
3. El destinatario en Gmail/Outlook recibe todos los archivos adjuntos con sus nombres originales legibles (no hashes).
4. Campañas anteriores siguen visualizándose y funcionando sin errores.

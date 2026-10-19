# Añadir Adjunto Opcional a Campañas de Mail

Este plan de implementación describe los pasos para permitir que los usuarios suban un archivo adjunto (PDF, DOCX, etc.) en las campañas de mail, el cual se enviará como un attachment real en el correo electrónico (a diferencia del flyer que se incrusta en el cuerpo).

## User Review Required

- **Migración de Base de Datos**: Se añadirá una nueva columna `adjunto_url` a la tabla `campanas`.
- **Multer (Archivos)**: Actualmente se sube un solo archivo (`flyer`). Se configurará Multer para aceptar múltiples campos (`flyer` y `adjunto`).

## Open Questions

- ¿Hay algún límite de tamaño específico para el archivo adjunto? Por defecto, los correos suelen rechazar archivos mayores a 25MB, y Multer limitará el tamaño de subida. Lo ajustaremos a 10MB por seguridad si no indicas lo contrario.
- ¿Hay algún tipo de archivo que quieras bloquear o permitir exclusivamente (ej. solo PDF)?

## Proposed Changes

---

### Base de Datos

#### [NEW] src/migrations/011_add_adjunto_url.sql
- Crear un nuevo script de migración que ejecute `ALTER TABLE campanas ADD COLUMN IF NOT EXISTS adjunto_url text;`

---

### Backend (API)

#### [MODIFY] src/schemas/campanaSchema.ts
- Añadir `adjunto_url: z.string().optional()` a los esquemas de validación (Crear y Actualizar).

#### [MODIFY] src/routes/campanaRoutes.ts
- Cambiar `upload.single('flyer')` por `upload.fields([{ name: 'flyer', maxCount: 1 }, { name: 'adjunto', maxCount: 1 }])`.

#### [MODIFY] src/controllers/campanaController.ts
- Modificar la lógica para extraer `flyer_url` y `adjunto_url` desde `req.files` en los endpoints `crear` y `actualizar`.

#### [MODIFY] src/services/campanaService.ts
- Asegurarse de que `adjunto_url` sea guardado y recuperado de la base de datos en las operaciones CRUD.

---

### Backend (Worker de Emails)

#### [MODIFY] src/services/emailWorker.ts
- En la función que envía el correo (`transporter.sendMail`), verificar si la campaña tiene un `adjunto_url`. Si lo tiene, añadirlo al array `attachments` de `nodemailer` leyendo el archivo localmente desde la carpeta `uploads`.

---

### Frontend

#### [MODIFY] client/src/types/campana.ts
- Añadir `adjunto_url?: string;` a la interfaz `Campana`.

#### [MODIFY] client/src/components/CrearCampana.tsx
- Añadir un estado para controlar la visibilidad del campo (ej. `const [conAdjunto, setConAdjunto] = useState(false)`).
- Añadir un botón toggle ("Añadir Adjunto Opcional") debajo o al lado del flyer para no romper el diseño responsive.
- Añadir un input de archivo `<input type="file" />` que se muestra solo si `conAdjunto` es true.
- Añadir el archivo seleccionado al objeto `FormData` que se envía al servidor bajo la key `adjunto`.

## Verification Plan

### Automated Tests
- Validar mediante el endpoint de creación de campaña subiendo ambos archivos (`flyer` y `adjunto`) y comprobando que los archivos existan en `/uploads` y la base de datos se actualice correctamente.

### Manual Verification
- Levantar el frontend y verificar el botón toggle.
- Crear una campaña de prueba con un archivo adjunto PDF.
- Forzar el envío a un correo propio y verificar que llega el mail con el flyer incrustado y el archivo adjunto descargable de forma nativa en Gmail/Outlook.

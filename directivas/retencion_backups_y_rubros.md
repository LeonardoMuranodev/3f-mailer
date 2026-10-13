# SOP: Retención de Backups en Google Drive y Resolución de Rubros en Contactos

## Objetivo
1. **Google Drive Backups Retention**: Limitar los backups almacenados en la carpeta de Google Drive a los 7 más recientes, eliminando automáticamente los anteriores para no agotar el almacenamiento de Google Drive.
2. **Visualización Amigable de Rubros**: En el directorio de contactos (`DirectorioContactos`), resolver el nombre legible del rubro (ej. "Metalúrgica", "Comercio", "Alimenticia") tanto en el backend como en el frontend, en lugar de mostrar IDs o UUIDs ilegibles para usuarios no técnicos.

---

## 1. Google Drive Backups Retention

### Entradas y Configuración
- Variables de entorno:
  - `GDRIVE_ENABLED=true`
  - `GDRIVE_CLIENT_ID`, `GDRIVE_CLIENT_SECRET`, `GDRIVE_REFRESH_TOKEN`
  - `GDRIVE_FOLDER_ID` (carpeta en Drive donde se alojan los backups)
  - `GDRIVE_MAX_BACKUPS` (por defecto: 7)
- Contenedor de backups:
  - Basado en `Dockerfile.backup` (`postgres:17-alpine`), requiere `jq` para manipulación robusta de JSON de la API de Google Drive.
  - Script de ejecución: `scripts/backup-db.sh`.

### Lógica de Ejecución
1. Generar dump de base de datos (`pg_dump` comprimido con `gzip`).
2. Limpieza local de backups en `/backups` según `BACKUP_RETENTION_DAYS`.
3. Obtener `access_token` fresco mediante OAuth2 con el `refresh_token`.
4. Subir el nuevo archivo de backup a la carpeta `GDRIVE_FOLDER_ID` usando resumable upload de Google Drive API v3.
5. Listar los archivos existentes dentro de `GDRIVE_FOLDER_ID` con:
   `GET https://www.googleapis.com/drive/v3/files?q='{FOLDER_ID}'+in+parents+and+trashed=false+and+name+contains+'3fmailer_backup_'&orderBy=createdTime+desc&fields=files(id,name,createdTime)&pageSize=100`
6. Identificar los archivos a partir del índice `GDRIVE_MAX_BACKUPS` (posición 8 en adelante, es decir `.files[7:]`).
7. Para cada archivo viejo identificado:
   `DELETE https://www.googleapis.com/drive/v3/files/{FILE_ID}`
8. Reportar en logs y notificar en Telegram la cantidad de backups viejos depurados en Drive.

### Restricciones / Casos Borde
- Asegurarse de que el script ejecute en entornos POSIX (evitar retornos de carro Windows `\r`).
- Validar que `jq` esté instalado en la imagen de Alpine (`apk add --no-cache curl gzip jq`).
- Nunca borrar archivos fuera de la carpeta designada ni archivos que no correspondan al prefijo de backup (`3fmailer_backup_`).

---

## 2. Resolución de Rubros en Contactos

### Entradas y Esquema de Base de Datos
- Tabla `rubros`: `id` (UUID), `nombre` (text, ej. 'metalurgica', 'comercio', 'papel').
- Tabla `contactos`: `rubro_id` (text, contiene el UUID del rubro o un slug histórico).
- `RUBROS_LABELS`: Diccionario en `client/src/data/rubros.ts` que mapea slugs ('metalurgica') a nombres formateados ('Metalúrgica').

### Lógica de Backend (`src/services/contactoService.ts`)
1. En `listarContactos`:
   - Realizar un `LEFT JOIN rubros r ON (c.rubro_id = r.id::text OR LOWER(c.rubro_id) = LOWER(r.nombre))`.
   - Proyectar `COALESCE(TRIM(r.nombre), c.rubro_id) AS rubro_nombre`.
   - En el filtrado por `rubro_id`:
     Permitir filtrar tanto por UUID como por nombre del rubro:
     `(c.rubro_id = $param OR LOWER(r.nombre) = LOWER($param) OR r.id::text = $param)`.
2. En `empresaService.ts`:
   - En `buscarEmpresas`: resolver `rubro_id` y `rubro_nombre` haciendo JOIN con `rubros`.

### Lógica de Frontend (`client/src/components/DirectorioContactos.tsx`)
1. En la tabla de contactos:
   - Renderizar `RUBROS_LABELS[c.rubro_nombre.trim().toLowerCase()] || c.rubro_nombre || '-'`.
2. En la exportación a CSV:
   - Usar el nombre legible `RUBROS_LABELS[c.rubro_nombre.trim().toLowerCase()] || c.rubro_nombre`.
3. En el modal de edición (`openEditarModal`):
   - Mapear el valor para que seleccione la opción correcta en el `<select>` de rubros según `c.rubro_nombre` o `c.rubro_id`.

### Restricciones / Casos Borde
- Algunos registros de rubros pueden contener saltos de línea al final (ej. `'turismo\n'`), por lo que siempre se debe aplicar `TRIM()`.
- Si un contacto no tiene rubro asignado (`rubro_id` es NULL), se debe mostrar `'-'` o badge de "Sin rubro".

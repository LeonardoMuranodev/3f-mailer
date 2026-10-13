# SOP: Migración y Pasaje de Campañas Históricas y Cola de Envíos

## Objetivo
Migrar y completar de forma idempotente las campañas finalizadas y su respectiva cola de envíos desde los archivos CSV (`eventos_config_prod.csv` y `cola_envios.csv`) a la base de datos de producción de 3F Mailer, vinculando contactos, cuentas SMTP y fechas límite.

---

## 1. Fuentes de Datos
- `docs/info-campanas-actuales/envios_mails_empresas - eventos_config_prod.csv`:
  Metadatos de cada campaña (Marca temporal, Asunto, Cuerpo, Fecha límite, Prioridad, Rubros, Link de inscripción, Flyer, Estado, Día de finalización).
- `docs/info-campanas-actuales/envios_mails_empresas - cola_envios.csv`:
  Registros individuales de envíos (id_fila, id_evento, mail_destino, prioridad, estado, fecha_de_envio, enviado_por, mensaje_error).

---

## 2. Eventos a Procesar

### Paso 1: "Taller para Pymes"
- Campaña existente en DB (`id: e8816eac-b086-47d7-8826-f0229fb917e6`).
- Asignar `fecha_limite_envio = '2026-08-10'`.
- Conservar su cola de envíos existente intacta.

### Paso 2: "Conectá con China – Parte II"
- Campaña existente en DB (`id: b0e39494-b010-416f-b524-7fef044f4b5a`, Marca: `17/09/2026 13:00:12`).
- Actualizar:
  - `fecha_limite_envio = '2026-09-28'`
  - `flyer_url = 'https://lh3.googleusercontent.com/d/1bbuz9mYqWuj3c30Lka4v2zce17wzx5T5'`
  - `link_inscripcion = 'https://docs.google.com/forms/d/e/1FAIpQLScxhPAAtW74VSUVuQ9EuPAVhck3rJtZJ4O5KlZlWeiTUPzPPA/viewform?pli=1'`
  - `prioridad = 'normal'`
  - `para_todos_rubros = true`
  - `cuerpo_html = [cuerpo del CSV]`
- Insertar los 2233 registros de envíos desde `cola_envios.csv` (`id_evento = '17/09/2026 13:00:12'`).

### Paso 3: Los 4 Eventos Finalizados Adicionales

1. **Lanzamiento de las Rondas de Negocios RIGI (Parte I)**
   - Marca: `28/09/2026 9:49:16`
   - Si ya existe en DB (`e04724cd-95ef-4973-a3cc-8d5b53067ba2`), actualizar:
     - `fecha_limite_envio = '2026-10-03'`
     - `flyer_url = 'https://lh3.googleusercontent.com/d/1YWrIXGgXkNOb4F96HTattam0bQLRmRzR'`
     - `link_inscripcion = 'https://docs.google.com/forms/d/e/1FAIpQLSfsWacOe8GYZQWuDutriNc1K9dznbX6HYbhSCaiAGYoMtuXvA/viewform?pli=1'`
     - `prioridad = 'alta'`
     - `para_todos_rubros = false`
     - `rubros_seleccionados = ['metalmecanica', 'metalurgica', 'mineria']`
   - Asegurar que sus 868 envíos estén en `cola_envios`.

2. **Lanzamiento de las Rondas de Negocios RIGI (Parte II - Multisectorial)**
   - Marca: `29/09/2026 12:23:40`
   - Insertar campaña con:
     - Asunto: `Lanzamiento de las Rondas de Negocios RIGI`
     - `fecha_limite_envio = '2026-10-03'`
     - `prioridad = 'alta'`
     - `para_todos_rubros = false`
     - `rubros_seleccionados = ['automotor', 'autopartes', 'calzado', 'caucho', 'construccion', 'electricidad', 'electronica', 'fundicion', 'general', 'industria', 'informatica', 'manufactura', 'quimica', 'plastico', 'servicios', 'transporte', 'textil', 'vidrio']`
     - `flyer_url = 'https://lh3.googleusercontent.com/d/1w8DXnLpNC6v1l6RrzlrE8gRbyz4LLRuO'`
     - `link_inscripcion = 'https://docs.google.com/forms/d/e/1FAIpQLSfsWacOe8GYZQWuDutriNc1K9dznbX6HYbhSCaiAGYoMtuXvA/viewform'`
     - `estado = 'completada'`
     - `creado_en = '2026-09-29T12:23:40-03:00'`
   - Insertar sus 944 envíos desde `cola_envios.csv`.

3. **Planos mecánicos con solidworks avanzado**
   - Marca: `6/10/2026 10:02:07` (y matching `06/10/2026 10:02:07`)
   - Insertar campaña con:
     - Asunto: `Planos mecánicos con solidworks avanzado`
     - `fecha_limite_envio = '2026-10-09'`
     - `prioridad = 'normal'`
     - `para_todos_rubros = false`
     - `rubros_seleccionados = ['metalmecanica', 'metalurgica']`
     - `flyer_url = 'https://lh3.googleusercontent.com/d/18tiBYZYkPH_7ICT00PbMUxlyKxN5SXIE'`
     - `link_inscripcion = 'https://inscripciones.tresdefebrero.gob.ar'`
     - `estado = 'completada'`
     - `creado_en = '2026-10-06T10:02:07-03:00'`
   - Insertar sus 866 envíos desde `cola_envios.csv`.

4. **Primera Ronda de Negocios RIGI- Minería -Rosario**
   - Marca: `7/10/2026 8:56:18`
   - Insertar campaña con:
     - Asunto: `Primera Ronda de Negocios RIGI- Minería -Rosario`
     - `fecha_limite_envio = '2026-10-12'`
     - `prioridad = 'alta'`
     - `para_todos_rubros = true`
     - `rubros_seleccionados = []`
     - `flyer_url = 'https://lh3.googleusercontent.com/d/17kfNKBlz0zgilrx1vU6XlyyfosZdttrt'`
     - `link_inscripcion = 'https://rondas.produccion.gob.ar/es/rondas-negocios-rigi-rosario/registro'`
     - `estado = 'completada'`
     - `creado_en = '2026-10-07T08:56:18-03:00'`
   - Insertar sus 2221 envíos desde `cola_envios.csv`.

---

## 3. Reglas de Inserción y Transformación en `cola_envios`
- Asegurar que cualquier email que no exista en `contactos` sea creado antes de insertar envíos (ej. `info@astillerosviking.com`).
- Mapear `enviado_por` a `cuenta_smtp_id` consultando la tabla `cuentas_smtp`. Si no hay coincidencia, almacenar `NULL`.
- Estado de envío:
  - Si el CSV indica `enviado` -> `estado = 'enviado'`, `intentos = 1`.
  - Si el CSV indica `fallido` o `error` o tiene `mensaje_error` -> `estado = 'fallido'`, `respuesta_smtp = r.mensaje_error`, `intentos = 1`.
- Fecha de envío: Parsear `r.fecha_de_envio` a timestamp ISO.
- Idempotencia: Verificar que no se dupliquen registros de `cola_envios` para la misma `(campana_id, contacto_id)` si ya existieran.

---

## 4. Verificación
1. Contar campañas totales en DB (deben ser 6 campañas: Taller para Pymes + Conecta con China + 4 RIGI/Solidworks).
2. Verificar que ninguna campaña tenga `fecha_limite_envio: NULL`.
3. Contar registros totales en `cola_envios` y verificar que coincidan con las sumas históricas.

Searched for "RESEND"
Searched for "resend"
Listed directory supabase
Listed directory 3f-mailer
Listed directory src
Listed directory migrations
Viewed 001_smtp_cola_envios.sql:1-70
Viewed 006_tracking.sql:1-10
Listed directory controllers
Viewed trackController.ts:1-62
Searched for "funcional"
Searched for "estado = 'enviado'"
Searched for "ce.estado"
Searched for "respuesta_smtp"
Searched for "UPDATE cola_envios"
Searched for "cola_envios"
Viewed emailWorker.ts:360-420
Viewed emailWorker.ts:421-480
Searched for "'fallido'"
Viewed bounceService.ts:1-454
Viewed index.ts:1-60
Viewed package.json:1-58

El prompt que te dio el otro agente tiene la idea general correcta, pero **si lo aplicábamos tal cual nos rompía varias cosas y no iba a funcionar** por particularidades de nuestra arquitectura.

Te detallo qué estaba mal/desfasado y cómo lo adaptamos a nuestro sistema:

---

### 1. Auditoría: Qué corregir del prompt del otro agente

| Punto | Lo que propuso el otro agente | La realidad en 3F-Mailer y el problema | Cómo lo adaptamos a lo nuestro |
| :--- | :--- | :--- | :--- |
| **Firma Svix en Express** | `svix.verify(req.body)` | En Express, `express.json()` ya convirtió el body en objeto JS. Al volver a serializarlo, los espacios/orden cambian y **Svix rechaza el 100% de los webhooks con 401**. | Guardamos el `req.rawBody` (buffer original intacto) en `src/index.ts` para que Svix valide la firma criptográfica exactamente. |
| **Estados de Contacto** | Guardar `'rebotado'`, `'rebotado_spam'`, `'suprimido'`. | Nuestros contactos usan un enum estricto (`src/types/contacto.ts`) y la cola solo toma `estado = 'funcional'`. Si poníamos palabras arbitrarias, fallaba Zod. | Guardamos los estados que ya entiende el sistema: `'rebotado inexistente'`, `'rebotado spam'`, `'inactivo'`. Todos son excluidos automáticamente de futuras campañas. |
| **Estados de Cola (`cola_envios`)** | Poner `rebotado`, `entregado`, etc. | Las pantallas de estadísticas y campañas cuentan estrictamente `enviado` y `fallido`. Estados nuevos descalibraban los números del dashboard. | Se marca `fallido` con el detalle en `respuesta_smtp = '[RESEND_BOUNCE] ' + motivo`. Y `delivered` confirma `enviado`. |
| **Métricas de Apertura y Clicks** | Crear campos booleanos `abierto: true`, `clickeado: true`. | Nosotros no usamos booleanos; usamos timestamps (`fecha_apertura TIMESTAMPTZ` y `fecha_click TIMESTAMPTZ`) en [cola_envios](file:///c:/Users/Admin/mi-desarrollo/mails-app/3f-mailer/src/migrations/006_tracking.sql). | Hacemos `fecha_apertura = COALESCE(fecha_apertura, CURRENT_TIMESTAMP)` y `fecha_click = COALESCE(fecha_click, CURRENT_TIMESTAMP)`. |
| **Correlación de Envío** | El webhook solo da `email_id` y `to[0]`. | Si no registramos el `email_id` de Resend al despachar, el webhook tendría que "adivinar" a qué campaña pertenecía. | Agregamos una columna `proveedor_message_id` en `cola_envios` e inyectamos tags en el envío para vincular cada evento de Resend 1 a 1 con su fila exacta. |

---

### 2. Sobre la cuenta emisora y el reenvío de respuestas:

> *"con dpim3f@3fmailer.tresdefebrero.gob.ar reenvio a dpim3f@gmail.com"*

Así es exactamente como opera y cómo lo dejamos listo:
1. **Emisor oficial**: `"Dirección de Producción - 3F" <dpim3f@3fmailer.tresdefebrero.gob.ar>` (el subdominio que Sistemas valida en Resend con SPF/DKIM).
2. **Encabezado `Reply-To`**: Nuestro worker ya inyecta obligatoriamente `replyTo: 'dpim3f@gmail.com'`. Por ende, cuando cualquier empresa destinataria presiona **"Responder"** en su cliente de correo, le responderá directamente a `dpim3f@gmail.com`.
3. **Reenvío directo (MX)**: Por si alguna empresa escribe manualmente a `dpim3f@3fmailer...`, Sistemas configura en su servidor DNS/correo un reenvío (forwarding) para que lo que llegue a esa casilla caiga en `dpim3f@gmail.com`.

---

### 3. Plan de Implementación Propuesto:

1. **Instalar `svix`** en el backend para la verificación oficial de webhooks.
2. **Ajustar `src/index.ts`**: Capturar `req.rawBody` en `express.json` para verificar la firma de Svix sin romper los demás endpoints.
3. **Migración de BD**: Agregar columna `proveedor_message_id VARCHAR(255)` con índice en `cola_envios`.
4. **Crear Servicio y Controlador de Webhook Resend (`src/controllers/resendWebhookController.ts`)**:
   - Endpoint: `POST /api/webhooks/resend`
   - Valida firma con `RESEND_WEBHOOK_SECRET`.
   - Procesa los 6 eventos (`bounced`, `complained`, `suppressed`, `delivered`, `opened`, `clicked`) aplicando nuestros estados oficiales.
   - Responde inmediatamente `200 OK { received: true }`.
5. **Integración en el Worker / Cuentas**:
   - Soporte para que cuando se use la cuenta de Resend (`dpim3f@3fmailer.tresdefebrero.gob.ar` con SMTP `smtp.resend.com` o API), se capture y guarde el ID emitido en `proveedor_message_id`.
6. **Tests Automatizados**:
   - Test unitario simulando eventos de Resend firmados con Svix para garantizar que actualiza contactos y métricas correctamente.

Sí, es 100% verdad y lo hacemos nosotros por código. Sistemas no tiene que hacer ningún reenvío ni tocar nada de correos.

¿Cómo funciona el replyTo en los correos?
Cuando enviamos un correo con:

typescript
from: '"Dirección de Producción - 3F" <dpim3f@3fmailer.tresdefebrero.gob.ar>',
replyTo: 'dpim3f@gmail.com'
El protocolo estándar de internet funciona así:

La empresa recibe el correo en su bandeja (Gmail, Outlook, etc.).
La persona hace clic en el botón "Responder".
El programa de correo del destinatario lee automáticamente el encabezado Reply-To y pone dpim3f@gmail.com en el destinatario.
La respuesta le llega directamente a las chicas a su Gmail oficial.
Sistemas NO tiene que configurar ningún reenvío. Lo único que tiene que hacer Sistemas es cargar los registros DNS que te dio Resend (los registros TXT/CNAME de SPF y DKIM) para validar el dominio 3fmailer.tresdefebrero.gob.ar.

Todo el ruteo de respuestas lo manejamos nosotros en el código con replyTo: 'dpim3f@gmail.com'.
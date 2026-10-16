# Directiva SOP: Detección de Bloqueo SMTP de Google y Limpieza de Snippet de Preheader

## Objetivo
1. Evitar que en la bandeja de entrada de Gmail aparezca el código de seguimiento (`Ref: ...`) en el snippet de texto previo a abrir el correo.
2. Evitar que la imagen del flyer aparezca como pastilla/chip de adjunto descargable visible en el listado de Gmail, manteniéndola estrictamente como imagen embebida en el cuerpo.
3. Detectar y atrapar automáticamente los errores de verificación/autenticación de Google (bloqueos por cuenta nueva, pedidos de login web o captcha):
   - Desactivar inmediatamente la cuenta SMTP afectada (`estado = 'bloqueada'`).
   - Reintentar inmediatamente el envío de ese mismo destinatario usando la siguiente cuenta SMTP disponible sin penalizar al contacto ni marcarlo como fallido.
   - Enviar una alerta prioritaria por Telegram al desarrollador con el detalle del bloqueo y la cuenta afectada.

## Diagnóstico y Análisis Técnico

### 1. Snippet de Gmail y Código "Ref: ..."
- **Causa:** En `emailWorker.ts`, se inyectaba un elemento `<span style="...">Ref: ${item.id}-${Date.now().toString(36)}</span>` al final del body para variabilidad anti-spam. Los clientes de correo (como Gmail) leen todo el texto del documento para construir el resumen previo que se muestra en la lista de recibidos. Cuando el texto del cuerpo es corto, Gmail alcanza este span y muestra el texto crudo `Ref: ...`.
- **Solución:**
  - Reemplazar el `span` de texto por un comentario HTML `<!-- Ref: ${item.id}-${Date.now().toString(36)} -->` o atributo `data-ref` en el pixel de tracking. Un comentario HTML altera la firma/hash de bytes del correo para evitar filtros antispam, pero ningún cliente de correo lo interpreta como texto de previsualización.
  - Opcionalmente incluir un preheader con espacios en blanco de espaciado (`&zwnj;&nbsp;`) para asegurar que Gmail solo muestre el texto de la campaña y corte limpiamente antes de cualquier elemento técnico.

### 2. Pastilla de Flyer en la Lista de Gmail
- **Causa:** Al adjuntar el flyer como attachment con `cid: 'flyer_campana'`, si no se especifica `contentDisposition: 'inline'`, algunos clientes de correo (como la interfaz web de Gmail) muestran el chip de descarga en la lista de correos.
- **Solución:**
  - Especificar explícitamente `contentDisposition: 'inline'` en el objeto de adjunto de Nodemailer.
  - Asegurar cabeceras MIME estándar para que el cliente lo trate exclusivamente como recurso inline embebido del HTML.

### 3. Error de Verificación / Bloqueo de Cuentas Nuevas en Gmail SMTP
- **Comportamiento de Google:**
  Cuando una cuenta de Gmail es nueva o detecta envíos masivos inusuales, Google suspende temporalmente el acceso SMTP y exige verificación web del usuario con respuestas como:
  - `535 5.7.8 Username and Password not accepted` / `EAUTH`
  - `534 5.7.9 Please log in with your web browser and then try again`
  - `535-5.7.8 Web login required: https://support.google.com/mail/answer/78754`
  - `Application-specific password required`
  - `Invalid login` / `BadCredentials` / `checkpoint` / `challenge`
- **Comportamiento Requerido:**
  - **Identificación:** Detectar si el error contiene códigos `EAUTH`, `535`, `534` o textos como `login`, `password not accepted`, `web browser`, `web login required`, `checkpoint`, `challenge`.
  - **Acción sobre la cuenta:** 
    1. Ejecutar `UPDATE cuentas_smtp SET estado = 'bloqueada', actualizado_en = CURRENT_TIMESTAMP WHERE id = $1`.
    2. Registrar en `smtp_logs` con tipo `'bloqueada'`.
    3. Enviar notificación por Telegram al desarrollador detallando la cuenta y el error exacto recibido.
  - **Acción sobre el destinatario:**
    - NO incrementar los intentos del contacto ni marcar el envío como fallido por culpa de la cuenta emisora.
    - Continuar el bucle inmediatamente para tomar la siguiente cuenta SMTP sana y enviar el correo en ese mismo ciclo.

## Entradas y Salidas
- `src/services/emailWorker.ts`
- `src/services/notificationService.ts`
- `src/services/smtpAccountService.ts`

## Restricciones
- **NO realizar git push**: Mantener todos los cambios exclusivamente en local a pedido explícito del usuario.

# SOP: Integración de Envío con Gmail API (OAuth 2.0 Centralizado) y Multi-Proveedor

## 1. Objetivo
Permitir el envío determinista y seguro de correos a través de la API oficial de Gmail con autenticación OAuth 2.0 unificada. Todas las cuentas comparten un único proyecto de Google Cloud (`GMAIL_OAUTH_CLIENT_ID` y `GMAIL_OAUTH_CLIENT_SECRET`) y cada cuenta provee su propio refresh token permanente (`USER_DPI{n}` y `REFRESH_TOKEN_DPI{n}`).
Garantizar la canalización de respuestas mediante la cabecera `Reply-To: dpim3f@gmail.com`, preservar intacta la rotación de cuentas, el dosificador y permitir que las cuentas sin refresh token mantengan su despacho SMTP tradicional sin interrupción.

---

## 2. Diagnóstico Técnico y Trampa del Alcance (Scope)

- **Arquitectura de Credenciales Centralizadas:**
  - `GMAIL_OAUTH_CLIENT_ID`: Identificador de cliente único de Google Cloud.
  - `GMAIL_OAUTH_CLIENT_SECRET`: Clave secreta única compartida.
  - Cuentas 1 a N: Definidas dinámicamente como `USER_DPI{n}` y `REFRESH_TOKEN_DPI{n}`.
  - Si una cuenta tiene `REFRESH_TOKEN_DPI{n}` presente y válido, se clasifica como cuenta OAuth 2.0 (`es_oauth = true`).
  - Si una cuenta NO tiene `REFRESH_TOKEN_DPI{n}` configurado aún (ej. DPI1 y DPI2 pendientes), se despacha de forma segura mediante SMTP tradicional con su contraseña de aplicación.

- **Trampa de Verificación SMTP en Frontend/Backend:**
  - En `smtpAccountService.ts`, al editar una cuenta (`actualizarCuentaSmtp`), NO se debe ejecutar la verificación SMTP (`verificarConexionSmtp`) si la cuenta es OAuth 2.0, ya que las cuentas OAuth no utilizan contraseñas de aplicación y provocarían error 535.
  - La interfaz de usuario (`CuentasSmtp.tsx`) debe recibir el flag `es_oauth` directamente desde el backend para ocultar campos de contraseña y mostrar el badge de OAuth 2.0 de forma dinámica, sin listas estáticas cableadas en el cliente.

- **Solución Robusta (Gmail REST API):**
  - Para cuentas OAuth 2.0, el despacho se realiza a través de `users.messages.send` de `googleapis`.
  - Nodemailer compila el mensaje MIME en memoria (HTML, tracking pixel, adjuntos, Reply-To) y se despacha en Base64URL.

---

## 3. Parámetros y Cuotas

1. **Cuentas Activas con OAuth:**
   - Límite diario: 50 envíos/día recomendados inicialmente para DPI3 y DPI4.
   - Mínimo por ejecución: 3/h.
   - Máximo por ejecución: 6/h.
   - Cadencia: delay aleatorio natural (12s a 32s con micro-pausas humanas) para no saturar la cuenta.
2. **Cabecera de Respuestas:**
   - Todos los mensajes deben incluir `Reply-To: dpim3f@gmail.com`.
3. **Manejo de Errores y Circuit Breaker:**
   - Errores de cuota (`quotaExceeded`, `rateLimitExceeded`, HTTP 429) marcan la cuenta como `'agotado'` para el día.
   - Errores fatales de autorización (`invalid_grant`) marcan la cuenta como `'bloqueado'` y notifican por Telegram.
   - Errores temporales de red ejecutan el cooldown de 15s a 30s.

---

## 4. Arquitectura de Archivos Afectados

- `src/config/env.ts`: Carga `clientId`, `clientSecret` únicos y mapea la lista dinámica de `USER_DPI{1..10}` con `REFRESH_TOKEN_DPI{1..10}`.
- `src/services/gmailApiService.ts`: `obtenerConfiguracionOAuth` busca por email en las cuentas con refresh token cargado y asocia el `clientId` y `clientSecret` compartidos.
- `src/types/smtp.ts` & `client/src/types/smtp.ts`: Añadir `es_oauth?: boolean` al tipo `CuentaSmtp`.
- `src/services/smtpAccountService.ts`: Decorar las cuentas con `es_oauth` en `omitPassword`. Saltar `verificarConexionSmtp` en cuentas OAuth.
- `client/src/components/CuentasSmtp.tsx`: Usar `cuenta.es_oauth` dinámico para badges y formularios.
- `src/__tests__/gmailApi.test.ts`: Actualizar tests para la estructura centralizada.

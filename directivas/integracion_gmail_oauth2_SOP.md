# SOP: Integración de Envío con Gmail API (OAuth 2.0) y Multi-Proveedor

## 1. Objetivo
Permitir el envío determinista y seguro de correos a través de la API oficial de Gmail con autenticación OAuth 2.0 (mediante `clientId`, `clientSecret` y `refreshToken`), eliminando la dependencia de contraseñas de aplicación SMTP para la cuenta `dpim3f3@gmail.com`. Garantizar la canalización de respuestas mediante la cabecera `Reply-To: dpim3f@gmail.com` y preservar intacta la rotación de cuentas, el dosificador y los límites diarios.

---

## 2. Diagnóstico Técnico y Trampa del Alcance (Scope)

- **Trampa de SMTP XOAUTH2:**
  - El token OAuth2 generado en Google Cloud posee el alcance `https://www.googleapis.com/auth/gmail.send`.
  - El servidor SMTP tradicional de Google (`smtp.gmail.com:465` con SASL XOAUTH2) rechaza este token con error `535 5.7.8` porque exige el alcance general `https://mail.google.com/`.
- **Solución Robusta (Gmail REST API):**
  - Para cuentas configuradas con OAuth2 (`dpim3f3@gmail.com`), el despacho se realiza a través de la API REST oficial de Gmail (`users.messages.send` de `googleapis`).
  - Nodemailer compila el mensaje MIME completo (HTML, cabeceras, adjuntos, píxel de tracking, `Reply-To`) en memoria.
  - El buffer MIME se codifica en Base64URL y se despacha directamente a Google.
  - Esto es inmune a bloqueos por "login sospechoso" y no requiere contraseñas de aplicación.

---

## 3. Parámetros y Cuotas

1. **Cuenta `dpim3f3@gmail.com`:**
   - Límite diario: 50 envíos/día.
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

- `src/config/env.ts`: Centralizar las variables OAuth de `dpim3f3`.
- `src/services/gmailApiService.ts`: Servicio dedicado para la compilación y despacho vía `googleapis`.
- `src/services/emailWorker.ts`: Bifurcar el transporte (si la cuenta es OAuth2 $\rightarrow$ Gmail API; en caso contrario $\rightarrow$ SMTP tradicional). Añadir `replyTo` en `mailOptions`.
- Base de datos (`cuentas_smtp`): Actualizar `limite_diario = 50`, `minimo_por_ejecucion = 3`, `maximo_por_ejecucion = 6` para `dpim3f3@gmail.com`.

# SOP: Cadencia Aleatoria y Prevención de Bloqueos SMTP (Anti-Fingerprinting)

## 1. Objetivo
Evitar el bloqueo, baneo o desafíos de seguridad ("web login required / checkpoint / suspicious activity") en cuentas de correo (especialmente Gmail / Google Workspace). El sistema debe eliminar cualquier patrón robótico predecible en los despachos del worker SMTP, simulando una cadencia natural e indistinguible de la actividad humana.

---

## 2. Diagnóstico de Bloqueos en Google SMTP

Google utiliza algoritmos de Machine Learning para analizar el tráfico saliente por SMTP. Los principales detonantes de bloqueo son:
1. **Cadencia Fija (Intervalos Predictivos):**
   - Enviar correos con un tiempo de espera idéntico (ej. exactamente 5.000 ms $\pm$ 5 ms entre cada uno). La desviación estándar cero es una firma inequívoca de bots.
2. **Ráfagas sin Espaciado (Burst Spikes):**
   - Disparar 30 o 50 correos en 2 minutos a primera hora y permanecer inactivo los 58 minutos restantes.
3. **Ausencia de Cooldown ante Errores:**
   - Si un envío falla por timeout o rechazo temporal (421 / 451 / 550), reintentar en milisegundos activa de inmediato el rate-limiting de Google.
4. **Cabecera `Message-ID` Genérica:**
   - Dejar que Nodemailer use `os.hostname()` produce Message-IDs con el nombre interno del contenedor Docker o PC, delatando que proviene de un servidor sin correspondencia con el dominio emisor.
5. **Cuerpos 100% Idénticos:**
   - Si 50 destinatarios reciben exactamente el mismo hash de mensaje sin variación invisible, los filtros heurísticos agrupan y marcan los envíos como spam.

---

## 3. Estrategia de Cadencia y Mitigación

### A. Jitter Aleatorio entre Envíos
- En lugar de un delay fijo, cada correo debe esperar un tiempo aleatorio generado dinámicamente:
  - **Modo Normal (Cron horario):**
    - Delay base aleatorio: entre **12 y 35 segundos** por correo (`randomInt(12000, 35000)`).
    - **Micro-pausas humanas:** Cada $N$ correos (ej. cada 5 a 8 envíos de forma aleatoria), introducir una pausa humana natural de **40 a 75 segundos**.
  - **Modo Forzado (Botón manual):**
    - Delay aleatorio más ágil: entre **5 y 12 segundos** por correo para dar feedback al usuario sin generar ráfagas.

### B. Cooldown obligatorio en caso de Error
- Si un envío genera una excepción o fallo de transporte (no bloqueo fatal), se debe esperar obligatoriamente entre **15 y 30 segundos** antes de proceder con el siguiente correo de la cola, permitiendo que el servidor SMTP receptor se descongestione.

### C. Generación de `Message-ID` Realista
- Configurar en `mailOptions` un `messageId` válido y coherente con el dominio emisor:
  `<${uniqueId}.${timestamp}@${dominioEmisor}>`.

### D. Variabilidad Heurística en el Contenido
- Inyectar en el HTML saliente un marcador invisible aleatorio único (entropy hash) que modifique la firma criptográfica del cuerpo sin alterar el renderizado visual ni el preheader de Gmail.

---

## 4. Casos Borde y Trampas Conocidas

- **Trampa 1 (Tiempo de ejecución que excede la hora):**
  - Si un lote es grande (ej. 50 correos) y cada uno espera 25 segundos, el lote tardará ~20 minutos.
  - *Regla:* Como `isWorkerRunning` previene ejecuciones simultáneas, si el worker tarda 20 minutos, terminará de forma segura mucho antes de la siguiente hora (a los 60 min).
- **Trampa 2 (Bloqueo por error de credenciales vs rate-limit):**
  - Si Google devuelve `535 / EAUTH / Web login required`, el circuit breaker existente debe desactivar la cuenta inmediatamente para no quemar las demás.

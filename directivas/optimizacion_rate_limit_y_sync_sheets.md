# Directiva SOP: Optimización de Rate Limiting y Sincronización de Google Sheets

## Objetivo
Resolver el error HTTP 429 (`TOO_MANY_REQUESTS` / "Demasiadas peticiones, intente más tarde") que experimentan los usuarios al utilizar la sincronización de Google Sheets y navegar en producción, desacoplando la sincronización para que no dependa únicamente del usuario ni sature los límites de peticiones, e implementando una estrategia de rate limiting inteligente para entornos municipales y de proxy inverso.

## Diagnóstico del Problema
1. **Límite Global Asfixiante en `src/index.ts`:**
   - Se tenía un `globalLimiter` configurado con `max: 300` peticiones cada 15 minutos aplicado a nivel de servidor Express completo.
   - En una Single Page Application (SPA), navegar entre contactos, paginar, filtrar y realizar polling de estado de sincronización consume 300 peticiones en menos de 2 minutos.
2. **Conflicto de IP Compartida (Nginx / Docker / Red Municipal):**
   - Cuando múltiples usuarios operan desde la misma red LAN municipal o a través de la cadena de proxies de Docker/Nginx, el rate limiting por IP agrupa todas las peticiones bajo la misma IP.
   - Con `trust proxy: 1`, una cadena de doble proxy (Nginx host + Nginx contenedor) puede reportar la IP interna del contenedor Docker, haciendo que todas las encargadas compartan un único contador de 300 peticiones.
3. **Consumo Innecesario por Polling:**
   - La comprobación recurrente del estado de sincronización (`/api/contactos/sync-status`) sumaba peticiones al rate limit general.

## Estrategia de Solución
1. **Rate Limiting Inteligente y Flexible:**
   - Configurar `trust proxy: true` para interpretar correctamente la cadena de encabezados `X-Forwarded-For`.
   - Ajustar el límite de peticiones globales (`globalLimiter`) a un umbral realista para SPA empresarial (3000 peticiones / 15 min).
   - En `apiLimiter`, implementar `keyGenerator` que priorice el ID de usuario autenticado (`req.user?.id`), cayendo a IP solo para peticiones anónimas. De este modo, distintas encargadas en la misma red municipal no compiten por el mismo cupo.
   - Excluir del conteo de rate limit (`skip`) las peticiones de polling ligero como `/api/contactos/sync-status`, `/api/health` y `/api/queue/:id/resumen`.
2. **Ruta Dedicada para Sincronización de Sheets:**
   - Aplicar un limiter específico y amigable para `/api/contactos/sync-sheets` que prevenga doble clic accidental (ej. 1 solicitud cada 5 segundos por usuario) con respuesta clara si ya hay una sincronización en marcha (HTTP 409).
3. **Sincronización Periódica Automática en Servidor (Cron Job):**
   - Agregar un cron en segundo plano (`node-cron`) en el backend que sincronice Google Sheets de forma autónoma (ej. cada 2 horas de lunes a viernes entre las 8:00 y las 18:00 hs, o al iniciar si las credenciales están configuradas).
   - Esto libera a las encargadas de tener que sincronizar manualmente antes de cada tarea, manteniendo los datos frescos de manera transparente.
4. **Optimización en el Frontend (`DirectorioContactos.tsx`):**
   - Aumentar el intervalo de polling de 3s a 5s para reducir tráfico.
   - Manejar el estado 409 ("Ya hay una sincronización en curso") activando el indicador de progreso sin alarmar con un mensaje de error.

## Entradas y Salidas
- **Archivos a modificar:**
  - `src/index.ts`
  - `src/middlewares/rateLimiter.ts`
  - `src/routes/index.ts`
  - `src/routes/contactoRoutes.ts`
  - `client/src/components/DirectorioContactos.tsx`
- **Verificación:**
  - Tests unitarios y de integración (`npm test`).
  - Compilación de TypeScript y build de cliente (`npm run build`).

## Restricciones y Casos Borde
- Mantener protegida la ruta de autenticación (`/api/auth/login`) con su propio `authLimiter` estricto (10 intentos / 15 min).
- No romper la ejecución en segundo plano (`syncContactosFromSheets().catch(...)`).
- Si faltan variables de Google Sheets en el `.env`, el cron automático no debe crashear el servidor, solo registrar un warning informativo en logger.

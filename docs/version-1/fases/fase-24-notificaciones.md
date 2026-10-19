# Fase 24: Sistema de Notificaciones en Tiempo Real (SSE + Web Notifications API)

Este documento detalla el plan de arquitectura e implementación para dotar a **3F Mailer** de un sistema integral de notificaciones en tiempo real, compuesto por una **estrategia híbrida**:
1. **Toast In-App flotante estilo Google Gemini** con la paleta de diseño institucional de Tres de Febrero cuando la encargada está dentro de la aplicación.
2. **Web Notifications API de Chrome / Windows** para alertar a la encargada incluso si está trabajando en otra ventana (ej. Google Docs, Excel de Drive o navegador minimizado), permitiéndole regresar inmediatamente a la aplicación con un solo clic.

---

## 1. Evaluación Técnica: ¿WebSockets o Server-Sent Events (SSE)?

Para transmitir alertas desde el servidor hacia el navegador de la encargada en tiempo real:

| Criterio | WebSockets (`ws` o `socket.io`) | Server-Sent Events (SSE / `EventSource`) ⭐ **Recomendado** |
| :--- | :--- | :--- |
| **Direccionalidad** | Bidireccional (Cliente ⇄ Servidor). | **Unidireccional** (Servidor ➔ Cliente). |
| **Casos de uso ideales** | Chats en vivo, pizarras colaborativas, juegos multijugador. | **Notificaciones push, alertas de fondo, monitoreo de tareas cron y workers.** |
| **Librerías requeridas** | Requiere dependencias pesadas cliente y servidor (`socket.io`, `socket.io-client`). | **Cero dependencias adicionales.** API estándar de JS en navegador (`EventSource`) y HTTP nativo en Express. |
| **Reconexión automática** | Debe programarse manualmente o delegarse a la librería externa. | **Nativa del navegador**. Si el backend se reinicia, el navegador reconecta automáticamente cada 3 segundos. |
| **Proxy / Nginx / Docker** | Requiere configurar directivas de *Upgrade* de protocolo (`Upgrade: websocket`) y control de timeouts. | Funciona sobre HTTP/1.1 y HTTP/2 estándar. Solo requiere cabeceras estándar `text/event-stream` y `X-Accel-Buffering: no`. |

### 💡 Veredicto Arquitectónico:
**Server-Sent Events (SSE)** es la elección óptima:
1. Las operaciones (ej. lanzar sincronización manual o aprobar campaña) ya se disparan mediante llamadas REST convencionales (`POST /api/contactos/sync-sheets`, etc.).
2. El frontend solo necesita **escuchar pasivamente** las notificaciones emitidas por el worker de emails o las sincronizaciones de Google Sheets (incluso las ejecutadas por tareas `cron` automáticas a las 08:00 AM).
3. Es sumamente liviano, consume mínima memoria en el servidor y no introduce vulnerabilidades ni sobrecarga de dependencias.

---

## 2. Estrategia Híbrida: Toast Gemini vs Notificaciones de Chrome

Para garantizar que la encargada no se pierda ningún evento sin resultar invasivo, el sistema evalúa la visibilidad de la pestaña (`document.visibilityState`):

```
                                  [ Evento SSE recibido ]
                                             │
                                             ▼
                        ¿La pestaña está visible en pantalla?
                                  (document.hidden)
                                    /           \
                                   /             \
                             [ SÍ ]               [ NO ] (En Google Docs / minimizado)
                               │                    │
                               ▼                    ▼
                    ┌─────────────────────┐  ┌────────────────────────────────────┐
                    │  TOAST IN-APP       │  │  CHROME / WINDOWS NOTIFICATION     │
                    │  Estilo Gemini      │  │  (Web Notifications API)           │
                    │  (Burbuja animada)  │  │  - Cartel flotante en escritorio   │
                    └─────────────────────┘  │  - Al hacer clic: window.focus()   │
                                             └────────────────────────────────────┘
```

### A. Toast In-App Estilo Google Gemini (Cuando la app está en foco)
- **Ubicación:** Esquina inferior derecha (`fixed bottom-5 right-5 z-50`), apilable.
- **Micro-interacciones:**
  - Animación fluida de entrada (`slide-in-right` con efecto muelle suave) y salida con desvanecimiento (`fade-out`).
  - **Barra de pulso indeterminada** con degradado institucional durante procesos activos (ej. mientras se descargan las filas de Google Sheets).
  - Al completarse el proceso, la tarjeta realiza un **morphing suave** hacia el estado de éxito con icono verde animado y conteo de registros.
  - Temporizador de auto-cierre (7 segundos) con barra regresiva sutil o botón manual `[✕]`.

### B. Web Notifications de Chrome (Cuando está en Google Docs u otra ventana)
- **Estándar:** HTML5 `window.Notification`.
- **Comportamiento en Windows/Mac:** Aparece como un cartel nativo del sistema operativo en el margen de la pantalla, con el sonido de notificación predeterminado del sistema.
- **Acción al Clic (`onclick`):**
  ```typescript
  notif.onclick = () => {
    window.focus(); // Trae al frente la pestaña de 3F Mailer en Chrome
    if (urlDestino) navigate(urlDestino); // Redirige a /campanas/:id o /contactos
    notif.close();
  };
  ```
- **Gestión de Permisos:**
  - Los navegadores requieren autorización explícita (`Notification.requestPermission()`).
  - Se añade un switch accesible en el Navbar y en el Perfil de usuario:
    `🔔 Alertas de escritorio: [ Activadas / Desactivadas ]`
  - Si no está autorizado, al hacer clic solicita la aprobación oficial del navegador:
    > *¿Permitir que 3F Mailer envíe notificaciones? [Permitir] [Bloquear]*

---

## 3. Paleta de Colores Institucional e Iconos Descriptivos

Utilizando los tokens de diseño ya configurados en `client/src/index.css` (Tailwind v4 `@theme` y soporte de Modo Claro / Modo Oscuro):

| Tipo de Alerta | Icono Lucide | Token de Color 3F | Hexadecimal | Modo Claro / Modo Oscuro | Ejemplo de Mensaje |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sincronización en Marcha** | `<RefreshCw className="animate-spin" />` | `--color-primary` | `#005CA9` (Azul 3F) | Barra azul con acento naranja y pulso brillante | *"Sincronizando contactos con Google Sheets..."* |
| **Sincronización Exitosa** | `<CheckCircle2 />` | `--color-secondary` / `--color-success` | `#16A34A` (Verde 3F) | Fondo `bg-success/10` con borde verde suave | *"Sincronización completada: 2.450 contactos actualizados (12 nuevos)."* |
| **Sincronización Fallida** | `<AlertTriangle />` | `--color-warning` | `#F59E0B` (Naranja/Ámbar) | Fondo ámbar con texto de advertencia | *"Error al leer Google Sheets: La hoja no tiene permisos públicos."* |
| **Campaña Iniciada** | `<Rocket />` | `--color-accent-orange` | `#D85C37` (Naranja Prod.) | Borde y acento naranja de producción | *"Campaña iniciada: 'Convocatoria Pymes 2026' comenzó a despacharse."* |
| **Campaña Completada** | `<PartyPopper />` | `--color-success` | `#16A34A` (Verde Aprobación) | Fondo verde con estadísticas integradas | *"Campaña finalizada: 320 correos enviados con éxito (0 errores)."* |
| **Cuota Diaria Agotada** | `<AlertTriangle />` | `--color-warning` | `#F59E0B` (Ámbar Advertencia) | Advertencia operativa del sistema | *"Límite diario alcanzado (500 mails). Envíos pausados hasta mañana."* |
| **Cuenta SMTP Bloqueada** | `<ShieldAlert />` | `--color-danger` | `#DC2626` (Rojo Peligro) | Borde rojo con botón de acción inmediata | *"Cuenta soporte3f@gmail.com deshabilitada preventivamente por Google."* |

---

## 4. Arquitectura del Backend

```
      [Google Sheets Cron / Botón Manual]            [Worker SMTP / Campañas]
                     │                                           │
                     ▼                                           ▼
         syncContactosFromSheets()                     procesarCola() / verificar...
                     │                                           │
                     └─────────────────┬─────────────────────────┘
                                       │
                                       ▼
                         src/services/realtimeService.ts
                        (Gestor Central de Conexiones SSE)
                                       │
                                       ▼
                        GET /api/notificaciones/stream
                                       │
                                       ▼ (text/event-stream)
                         [Cliente Web de la Encargada]
```

### Archivo 1: `src/services/realtimeService.ts`
Gestor central en memoria para registrar y emitir eventos a clientes conectados:
```typescript
import { Response } from 'express';

export type RealtimeEventType =
  | 'sync_started'
  | 'sync_finished'
  | 'campaign_started'
  | 'campaign_finished'
  | 'smtp_quota_warning'
  | 'smtp_account_issue';

export interface RealtimePayload {
  tipo: RealtimeEventType;
  titulo: string;
  mensaje: string;
  detalles?: Record<string, unknown>;
  urlDestino?: string;
  timestamp: string;
}

interface ClienteConectado {
  id: string;
  usuarioId: string;
  rol: string;
  res: Response;
}

const clientes = new Map<string, ClienteConectado>();

export function agregarClienteSSE(id: string, usuarioId: string, rol: string, res: Response): void {
  clientes.set(id, { id, usuarioId, rol, res });
}

export function removerClienteSSE(id: string): void {
  clientes.delete(id);
}

export function emitirAlertaRealtime(payload: RealtimePayload, rolesPermitidos: string[] = ['desarrollador', 'encargada']): void {
  const data = JSON.stringify(payload);
  for (const [, cliente] of clientes) {
    if (rolesPermitidos.includes(cliente.rol)) {
      cliente.res.write(`event: notificacion\ndata: ${data}\n\n`);
    }
  }
}
```

### Archivo 2: `src/controllers/notificacionController.ts` y Rutas
- **Ruta:** `GET /api/notificaciones/stream`
- **Configuración de cabeceras HTTP:**
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache, no-transform`
  - `Connection: keep-alive`
  - `X-Accel-Buffering: no` (evita el buffer intermedio en Nginx).
- **Heartbeat:** Cada 25 segundos se envía un comentario `: ping\n\n` para que proxies intermedios no corten la conexión por inactividad.

### Archivo 3: Instrumentación en Servicios Existentes
1. **En `src/services/googleSheetsService.ts`:**
   - Al comenzar `syncContactosFromSheets()`:
     ```typescript
     emitirAlertaRealtime({
       tipo: 'sync_started',
       titulo: 'Sincronización en curso',
       mensaje: 'Conectando con Google Sheets para actualizar contactos...',
       timestamp: new Date().toISOString()
     });
     ```
   - Al finalizar en el bloque `finally`:
     ```typescript
     emitirAlertaRealtime({
       tipo: 'sync_finished',
       titulo: lastSyncResult?.success ? 'Sincronización completada' : 'Error en sincronización',
       mensaje: lastSyncResult?.message || 'Proceso finalizado',
       detalles: lastSyncResult,
       urlDestino: '/contactos',
       timestamp: new Date().toISOString()
     });
     ```

2. **En `src/services/emailWorker.ts`:**
   - Al iniciar despacho de una campaña (`campana.estado` pasa a `en_proceso`):
     ```typescript
     emitirAlertaRealtime({
       tipo: 'campaign_started',
       titulo: 'Campaña iniciada',
       mensaje: `El despacho de "${campana.asunto}" ha comenzado.`,
       urlDestino: `/campanas/${item.campana_id}`,
       timestamp: new Date().toISOString()
     });
     ```
   - En `verificarCampanasCompletadas()` al terminar:
     ```typescript
     emitirAlertaRealtime({
       tipo: 'campaign_finished',
       titulo: 'Campaña completada',
       mensaje: `"${campana.asunto}" finalizó. ${stats.enviados} enviados, ${stats.fallidos} fallidos.`,
       detalles: stats,
       urlDestino: `/campanas/${campana.id}`,
       timestamp: new Date().toISOString()
     });
     ```

---

## 5. Arquitectura del Frontend (React + Zustand + Web API)

### Archivo 1: Store Global `client/src/stores/useNotificationStore.ts`
- Administra la conexión `EventSource` activa vinculada a la sesión JWT del usuario.
- Gestiona el estado de permisos de la Web Notification API (`permission: NotificationPermission`).
- Controla el array de toasts activos y el historial de notificaciones.
- Al recibir un evento SSE:
  1. Si `document.hidden === true` y `permission === 'granted'`: lanza `new Notification(...)` con `onclick` que enfoca la pestaña y navega a la URL.
  2. Siempre agrega el toast a la lista visual para que, al volver a la pestaña, también esté visible o en el historial.

### Archivo 2: Componente Flotante `client/src/components/GeminiNotificationContainer.tsx`
- Se monta en la raíz de `client/src/App.tsx`.
- Renderiza la pila de tarjetas flotantes con transiciones de Tailwind y micro-animaciones:
  - Spinner dinámico para `sync_started`.
  - Iconos descriptivos de color específico para cada evento.
  - Botón de cierre manual y temporizador de progreso.

### Archivo 3: Centro de Notificaciones en el Navbar
- Icono `<Bell />` en el Navbar de `App.tsx` con un badge indicador rojo con contador de notificaciones no leídas.
- Menú desplegable tipo popover que lista las últimas 10 alertas recibidas en la jornada con marca de tiempo relativa (ej. *"Hace 5 min"*).
- Botón para *"Solicitar permisos de alertas de escritorio"* si el usuario aún no los habilitó.

---

## 6. Ajustes de Infraestructura y Rate Limiting

1. **Exclusión de Rate Limit (`src/index.ts` y `src/middlewares/rateLimiter.ts`):**
   - El endpoint `/api/notificaciones/stream` mantiene una conexión HTTP permanente. Por lo tanto, debe excluirse en la función `skip` del rate limiter:
     ```typescript
     skip: (req) => {
       return req.path.endsWith('/sync-status') || 
              req.path.endsWith('/stream') || 
              req.path.endsWith('/health');
     }
     ```

2. **Configuración de Nginx en Producción (`ubuntu@172.16.152.60`):**
   - Asegurar que la configuración del bloque `location /api/` cuente con:
     ```nginx
     proxy_set_header Connection '';
     proxy_http_version 1.1;
     chunked_transfer_encoding off;
     proxy_buffering off;
     proxy_cache off;
     ```
   - Esto evita que Nginx retenga los eventos de SSE en un buffer temporal y permite la llegada instantánea al navegador.

---

## 7. Hoja de Ruta de Implementación (Roadmap)

- [ ] **Fase 1: Backend SSE Core:**
  - Crear `src/services/realtimeService.ts` y su tipado TypeScript estricto.
  - Implementar el controlador y la ruta `GET /api/notificaciones/stream` protegida por JWT y roles.
  - Excluir `/stream` en el middleware de rate limiting.

- [ ] **Fase 2: Conexión de Eventos en Backend:**
  - Conectar llamadas a `emitirAlertaRealtime` en `googleSheetsService.ts` (inicio y fin de sync).
  - Conectar llamadas en `emailWorker.ts` (inicio y fin de campañas, cuota agotada).

- [ ] **Fase 3: Frontend Store y Web Notifications API:**
  - Crear `client/src/stores/useNotificationStore.ts`.
  - Implementar la escucha de `EventSource` y la lógica de detección de `document.hidden`.
  - Implementar la función de solicitud de permisos nativos de Chrome (`Notification.requestPermission()`).

- [ ] **Fase 4: Componentes Visuales Estilo Gemini:**
  - Crear `GeminiNotificationContainer.tsx` y `NotificationToast.tsx` con la paleta de 3F y Tailwind v4.
  - Incorporar la campana de notificaciones con historial en el Navbar de `App.tsx`.

- [ ] **Fase 5: Verificación y Pruebas en Vivo:**
  - Probar sincronización manual y comprobar que el toast se actualice fluidamente.
  - Probar pasar a otra pestaña (Google Docs) y comprobar la aparición de la notificación del sistema de Chrome / Windows y el retorno con `window.focus()`.

# SOP: Análisis de Fallos en Campañas y Verificación Pre-Despliegue a Producción

## Objetivo
1. **Desglose Robusto de Fallos en Campañas**: Incorporar la categoría "Cancelado" y resolver el análisis de fallos directamente desde el backend para que nunca muestre "Buscando datos..." ni dependa de filtros de tabla en la interfaz.
2. **Verificación Integral Pre-Despliegue**: Auditar el sistema completo (Backend, Frontend, Base de Datos, Docker, Git y variables de entorno) para asegurar un despliegue sin errores al servidor de producción.

---

## 1. Desglose de Fallos en Estadísticas de Campaña

### Backend (`src/services/campanaService.ts`)
- En `obtenerCampanaConEstadisticas(id)`:
  - Ejecutar consulta agrupada sobre `cola_envios` para estados fallidos o con respuesta SMTP registrada.
  - Normalizar mensajes en categorías claras:
    - **Cancelado**: si incluye `cancelad` (ej. 68 registros cancelados por el usuario/sistema).
    - **Dominio Inexistente**: si incluye `domain not found`, `nxdomain`, `no such domain`, `el correo o dominio no existe`.
    - **Rechazado por Spam**: si incluye `spam`, `blocked`, `blacklisted`, `bloqueado`, `política del servidor`.
    - **Email Mal Escrito**: si incluye `mail_mal_escrito`, `syntax error`.
    - **Casilla Llena (Destinatario)**: si incluye `mailbox full`, `storage full`, `bandeja de entrada llena`.
    - **Cuota Excedida (Remitente)**: si incluye `daily sending limit`, `quota exceeded`.
    - **Credenciales/Login SMTP**: si incluye `login`, `auth`, `password`, `webloginrequired`.
    - **Otros / No categorizado**: otros motivos no clasificados.
  - Retornar `desglose_fallos: Array<{ categoria: string; cantidad: number; porcentaje: number }>` dentro de `campana.stats`.

### Frontend (`DetalleCampana.tsx` y `client/src/types/campana.ts`)
- Tipar `desglose_fallos` en `CampanaConStats`.
- En la sección "Análisis de Fallos" de `DetalleCampana.tsx`:
  - Si `campana.stats.desglose_fallos` está presente y tiene elementos, renderizar directamente las tarjetas de fallos con su cantidad y porcentaje.
  - En caso de no haber datos en el momento, mostrar mensaje informativo en lugar del texto transitorio "Buscando datos...".

---

## 2. Checklist de Verificación para Servidor (Producción)
- **Compilación TypeScript Backend**: `npm run build` (`tsc`) sin errores.
- **Compilación Frontend**: `tsc -b && vite build` sin errores ni advertencias de variables no usadas.
- **Base de Datos y Migraciones**: Tablas sincronizadas (`campanas`, `cola_envios`, `contactos`, `empresas`, `rubros`, `cuentas_smtp`, `usuarios`, `auditoria`).
- **Archivos excluidos / Sensibles**:
  - `docs/info-campanas-actuales/` y archivos `.env` ignorados en `.gitignore`.
- **Contenedores Docker**: Healthchecks pasando (`backend` healthy, `redis` healthy, `db-backup` con retención de 7 días configurada).

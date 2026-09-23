# Implementación de Perfil, Historial y Recuperación de Contraseña

Este plan abarca las funcionalidades solicitadas para el sprint, asegurando un control robusto de auditoría y gestión de cuentas.

> [!IMPORTANT]
> **Revisión del usuario:** Necesito que me confirmes si este enfoque para el esquema de base de datos del Historial es suficiente, y si preferís enviar los mails de recuperación vía Nodemailer estándar usando la cuenta de producción (SMTP).

## Open Questions

1. **Retención del Historial:** ¿El historial debe guardarse para siempre o queremos un límite (por ejemplo, borrar registros de más de 1 año de antigüedad)?
2. **Tabla del Historial:** Para el registro, propongo guardar: `usuario_id`, `accion` (Crear, Actualizar, Borrar), `entidad` (Campaña, Contacto, etc.), `detalles` (qué campos cambiaron) y `fecha`. ¿Te parece bien este nivel de detalle?

## Proposed Changes

---

### Backend: Base de Datos & Auditoría

#### [NEW] `src/migrations/012_add_historial_table.sql`
- Tabla `historial_cambios` para auditar acciones (`id`, `usuario_id`, `accion`, `entidad`, `entidad_id`, `detalles`, `creado_en`).
- Tabla `tokens_recuperacion` para manejar la funcionalidad de reseteo de password temporal.

#### [NEW] `src/services/historialService.ts`
- Lógica para `registrarAccion(usuarioId, accion, entidad, detalles)`.
- Lógica para obtener el historial global y el de un usuario específico.

#### [MODIFY] `src/controllers/` (campana, contacto, smtp, usuarios)
- Inyectar el llamado a `historialService.registrarAccion()` en los endpoints de creación, modificación y eliminación (mutaciones).

#### [NEW] `src/routes/historialRoutes.ts` & `src/controllers/historialController.ts`
- `GET /api/historial` (Para el rol desarrollador: ver todo).
- `GET /api/historial/me` (Para el perfil del usuario actual).

---

### Backend: Recuperación y Cambio de Contraseña

#### [NEW] `src/routes/authRoutes.ts` (Nuevos Endpoints)
- `POST /api/auth/forgot-password`: Recibe el email y envía el token temporal.
- `POST /api/auth/reset-password`: Recibe el token temporal y la nueva contraseña.
- `POST /api/auth/change-password`: Para usuarios ya logueados desde "Mi Perfil".

#### [MODIFY] `src/services/emailWorker.ts` / `notificationService.ts`
- Crear el template HTML para los correos de recuperación (usando el Banner de "Dirección de Producción").

---

### Frontend: UI / Componentes

#### [NEW] `client/src/pages/Perfil.tsx`
- Vista del perfil del usuario mostrando su Email y su Rol actual.
- Formulario de **Cambiar Contraseña**.
- Tabla de **"Mis Cambios"** consumiendo `/api/historial/me` mostrando solo sus acciones.

#### [NEW] `client/src/pages/ForgotPassword.tsx` & `client/src/pages/ResetPassword.tsx`
- Vistas accesibles solo para usuarios no logueados (`PublicRoute`).
- Flujo para ingresar el email y posterior confirmación.

#### [MODIFY] `client/src/App.tsx` & `client/src/components/Sidebar.tsx`
- Agregar las nuevas rutas.
- Añadir el botón "Mi Perfil" en la navegación lateral o en el header superior derecho.

## Verification Plan

### Automated / Backend
- Levantar el servidor para verificar las tablas nuevas.
- Probar Postman/cURL contra las rutas de historial y auth para garantizar las respuestas `200 OK` y `400 Bad Request` en caso de tokens expirados.

### Manual Verification
1. Acceder al Perfil, cambiar la contraseña y verificar que la próxima vez que se inicie sesión la contraseña antigua ya no funciona.
2. Hacer modificaciones aleatorias (crear campaña, actualizar contacto) y ver que se listen en el Historial del Perfil.
3. Hacer logout, hacer click en "Olvidé mi contraseña", revisar la bandeja de entrada del correo, e intentar reestablecer la password con un token válido y uno inválido.

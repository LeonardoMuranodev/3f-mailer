Viewed TASK.md:20-40

¡Hola de nuevo! Entendido, dejaremos todo como está y vamos a enfocarnos en **planificar el Control de Horario de Envío SMTP**.

Aquí tienes el plan paso a paso de cómo lo implementaría basándome en los requerimientos del `TASK.md`. Léelo y dime qué te parece o si le agregarías algo.

---

### Plan de Implementación: Control de Horario SMTP

#### 1. Base de Datos (Migraciones)
Necesitamos dos estructuras nuevas. Voy a crear un archivo de migración para:
- **Tabla `configuracion_horarios`** (Patrón Singleton de 1 sola fila garantizada):
  - `hora_inicio` (TIME, ej: `08:00:00`)
  - `hora_fin` (TIME, ej: `18:00:00`)
  - `dias_permitidos` (JSONB, ej: `[1, 2, 3, 4, 5]` para Lunes a Viernes).
- **Tabla `fechas_excluidas`** (Feriados / Días no laborales):
  - `id` (UUID, Primary Key)
  - `fecha` (DATE, UNIQUE)
  - `motivo` (VARCHAR, ej: "Navidad", "Día del empleado municipal").

#### 2. Backend (API, Worker & Validaciones)
- **Nuevos Endpoints (`/api/horarios`)**:
  - `GET /api/horarios` -> Trae horas, días permitidos y todas las fechas excluidas.
  - `PUT /api/horarios` -> Actualiza horas y días permitidos.
  - `POST /api/horarios/excepciones` -> Agrega un nuevo día excluido (feriado).
  - `DELETE /api/horarios/excepciones/:id` -> Elimina un feriado.
- **Seguridad**: Todas estas rutas usarán el middleware existente `requireRole(['desarrollador', 'encargada'])` para bloquear a los "invitados".
- **Lógica del `emailWorker.ts`**:
  - Antes de empezar a jalar mails de `cola_envios`, el worker llamará a un helper `validarVentanaDeEnvio()`.
  - Esta función verificará si la fecha/hora actual (en la zona horaria de Argentina `America/Argentina/Buenos_Aires`) está dentro de `dias_permitidos`, dentro del rango `hora_inicio` - `hora_fin` y NO existe en `fechas_excluidas`.
  - Si la verificación falla, el worker simplemente hace un `return` (salta el ciclo sin hacer envíos) y vuelve a intentar en su próximo intervalo cron (esperando a que sea el horario correcto).

#### 3. Frontend (UI / React)
- **Nueva Ruta y Menú**:
  - Agregar un ítem en el Sidebar llamado **"Horarios SMTP"** (solo visible para desarrollador y encargada).
  - Configurar la ruta en `App.tsx` con su `ProtectedRoute`.
- **Componente `ConfiguracionHorarios.tsx`**:
  - **Sección 1: Rango Horario**: Inputs HTML tipo `time` (`<input type="time">`) para establecer fácilmente de qué hora a qué hora se envía.
  - **Sección 2: Días Hábiles**: Un grupo de 7 toggles/checkboxes (estilo "Chips" que cambien a color primario si están activos) para seleccionar de Lunes a Domingo.
  - **Sección 3: Días No Laborales / Feriados**:
    - Un mini-formulario lateral para seleccionar una fecha y opcionalmente un motivo.
    - Una lista/tabla elegante mostrando los feriados guardados (ordenados por fecha próxima) con un botón con icono de tacho de basura para eliminarlos.

---

¿Qué te parece la estructura? Si estás de acuerdo, dímelo y arranco a implementar paso por paso (primero BD, luego Backend y Worker, por último Frontend).

Edited TASK.md
Viewed TASK.md:37-55
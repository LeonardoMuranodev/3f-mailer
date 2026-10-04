# Plan de Capacitación en Video: Mails App 3F

## 1. Estrategia de Formato: ¿Largo o Cortos?
**Recomendación definitiva: Varios videos cortos (Microlearning o "Píldoras").**
- **Por qué:** Si haces un video de 15 minutos, cuando las encargadas se olviden de algo específico (por ejemplo, cómo adjuntar un archivo), les dará pereza buscar el minuto exacto. Si tienen un video de 1-2 minutos llamado "Cómo crear una campaña", irán directo al grano.
- **Tono:** Profesional, calmado, y enfocado 100% en el uso práctico (no hables de código, base de datos ni Docker; háblales en términos de "Contactos", "Campañas" y "Rebotes").

## 2. Dónde Alojarlos para Fácil Acceso
Tienes dos opciones excelentes y gratuitas:

1. **YouTube (Videos Ocultos / Unlisted):** Es el rey. Subes los videos como "Ocultos" para que no salgan en búsquedas públicas, creas una Lista de Reproducción (Playlist) y les pasas un único link. Además, lo pueden ver desde la compu o el celular perfecto.
2. **Loom / Screen Studio:** Te permite grabar tu pantalla y tu micrófono al mismo tiempo. Al terminar, te da un link al instante sin tener que esperar a que se renderice.
   - *Tip Pro:* Puedes copiar los links de los videos y armar un PDF sencillo o un documento de Google Docs llamado "Manual de Uso Rápido" con los hipervínculos. 

---

## 3. Plan Paso a Paso y Qué Mostrar (El Guion)

A continuación, el flujo ideal para grabar tus videos. Prepara la base de datos de prueba (`seed`) para que se vea con datos reales y estéticamente atractiva antes de grabar.

### Video 1: Introducción, Acceso y Perfil (⏱️ ~1:30 min)
- **Objetivo:** Que sepan cómo entrar y recuperar contraseña.
- **Acciones a mostrar:**
  1. Pantalla de Login.
  2. Demostración rápida de "Olvidé mi contraseña" (mostrar cómo llega el mail y se cambia).
  3. Ingreso al panel principal.
  4. Vista del Perfil de usuario (para cambiar contraseña estando logueados).

### Video 2: Gestión del Directorio de Contactos (⏱️ ~3:00 min)
- **Objetivo:** Enseñarles a mantener la base limpia y actualizada.
- **Acciones a mostrar:**
  1. Un vistazo general a la tabla, los colores de los estados (Funcional, Rebotados, Inactivos).
  2. Explicar brevemente el **botón de Sincronizar con Sheets** (mostrar cómo trae los datos del excel que ellas manejan).
  3. Crear un contacto manual: Hacer énfasis en el nuevo autocompletado de **Empresa** y **CUIT**. Mostrar cómo es a prueba de errores humanos.
  4. Uso de los filtros (por Rubro o Estado).

### Video 3: Creación y Envío de Campañas (El más importante) (⏱️ ~4:00 min)
- **Objetivo:** Mostrar el core de la aplicación paso a paso.
- **Acciones a mostrar:**
  1. Ir a "Crear Campaña" y llenar el Asunto.
  2. Uso del Editor de texto (negritas, listas).
  3. Agregar links institucionales (Inscripción, Nación, Provincia).
  4. Subir un Flyer y un Archivo Adjunto (resaltar que el sistema guarda el nombre original).
  5. Segmentación: Elegir rubros específicos vs Enviar a todos.
  6. Configurar la Fecha de vencimiento.
  7. **Momento Clave:** Darle a "Enviar" y mostrar cómo pasa a estado "En proceso" o "Aprobada", y explicar brevemente que **los envíos se hacen solos en horario laboral por detrás**.

### Video 4: Estadísticas y Analíticas (⏱️ ~2:30 min)
- **Objetivo:** Mostrarles el impacto de sus envíos.
- **Acciones a mostrar:**
  1. Dashboard General: Ver totales, aperturas y clicks. Mostrar que ahora se ve de manera premium y dinámica.
  2. Historial detallado de envíos: Dónde ver a quiénes ya se les mandó y a quiénes rebotó.
  3. Filtros de analíticas (Últimos 7 días, Este mes, etc.).

### Video 5: Casos Especiales (Rebotes y Auditoría) (⏱️ ~2:00 min)
- **Objetivo:** Tranquilizarlas respecto a los correos que no llegan y mostrar transparencia.
- **Acciones a mostrar:**
  1. Explicar qué pasa si un correo de una empresa está mal escrito (El sistema lo detecta y lo marca rojo automáticamente para no enviarle más, protegiendo el dominio de 3F).
  2. Vista de Auditoría (solo si ellas tienen acceso a esto): Para que vean el rastro de quién creó qué cosa y a qué hora.

---

## 4. Checklist para antes de pulsar "Grabar"
- [ ] Refresca la base de datos con el comando de seed completo para que haya gráficos llenos y datos coloridos.
- [ ] Oculta la barra de marcadores de tu navegador.
- [ ] Pon tu celular en silencio y cierra pestañas personales o de WhatsApp Web.
- [ ] Haz un ensayo en voz alta ("run-through") de un video sin grabar para soltar la lengua.

# Auditoría de Experiencia de Usuario y Accesibilidad (3F Mailer)

## 1. Menú de Navegación Lateral (Sidebar / Navbar)
🟢 **Puntos Fuertes:** 
- El menú actual está bien estructurado y utiliza iconografía consistente (lucide-react).
- Se contrae en móvil, lo cual es excelente para ahorrar espacio de pantalla.

🔴 **Puntos de Fricción / Carga Cognitiva:** 
- Como indicaste, la sección del perfil (ej: "Desarrollador") abajo o arriba en el Nav no parece un botón clickeable. Carece de affordance (pistas visuales de interactividad).
- Esta solucionado (no romper): Al tocar el perfil en móvil, se abre junto con el menú y tapa la pantalla, rompiendo el flujo.

♿ **Barreras de Accesibilidad:**
- Falta de estados `:focus-visible` claros si un usuario navega con Tab.

💡 **Soluciones Accionables:**
- **UI Perfil:** Envolver la sección del usuario en el Nav con un `<button>` que tenga un `hover:bg-slate-100` (o `hover:bg-white/10` en oscuro) y un borde sutil `border border-transparent hover:border-slate-200`. Añadir un ícono de flecha hacia abajo (`ChevronDown`) para indicar que despliega opciones (como "Mi Actividad" o "Cerrar sesión").
- **Móvil:** Cuando se toca el perfil en móvil, el menú principal debe cerrarse (`setIsOpen(false)`) y llevarte a una vista dedicada, o abrir un Modal/Sheet modal, en lugar de empujar el contenido de forma desprolija.

---

## 2. Pantalla: Lista de Campañas (Dashboard)
🟢 **Puntos Fuertes:** 
- La barra superior de filtros es súper útil.
- Los badges de colores para los estados (Aprobada, Borrador, etc.) reducen mucho la carga cognitiva.

🔴 **Puntos de Fricción / Carga Cognitiva:** 
- La tabla puede sentirse abrumadora si hay muchos textos largos (ej: muchos destinatarios).
- La acción de "Archivar" o "Eliminar" a veces requiere dos clicks (confirmación) pero el modal de confirmación podría sentirse intrusivo si se hace repetidamente.
- El retraso visual por la caché de la API que acabamos de resolver causaba la sensación de que "el botón no funcionó".

♿ **Barreras de Accesibilidad:**
- El contraste de algunos botones (ej. textos grises sobre fondos grises claros) puede ser bajo. 
- Los íconos en la columna "Acciones" (Play, Pause, Trash) no tienen etiquetas de texto visibles y dependen exclusivamente del atributo `title` de HTML, el cual no siempre es leído por los screen readers o no es visible en mobile.

💡 **Soluciones Accionables:**
- **Microcopy:** Cambiar los `title="Eliminar"` por un tooltip nativo u ocultar texto exclusivo para lectores de pantalla `<span className="sr-only">Eliminar campaña</span>`.
- **UI:** Aumentar el contraste del color `text-muted` a un gris más oscuro (`text-slate-500` -> `text-slate-600`) para cumplir el ratio 4.5:1 (WCAG AA).

---

## 3. Pantalla: Crear / Editar Campaña
🟢 **Puntos Fuertes:** 
- La separación visual en "tarjetas" (Asunto, Contenido, Archivos, Links) estructura muy bien un formulario complejo.
- La "Vista Previa" con el sobrecito animado o modal es un toque emocional excelente que da mucha confianza antes de mandar 10.000 mails.

🔴 **Puntos de Fricción / Carga Cognitiva:** 
- Mensajes de error en bloque (ej: "Error de Validación de los datos"). Cuando hay errores de campos específicos (fecha límite vacía, link faltante), el usuario debe buscar el campo rojo en lugar de que el sistema lo lleve directo.
- Si el usuario marca la casilla de "Links de inscripción múltiple", el input de "Link Único" desaparece abruptamente, lo que puede desorientar.

♿ **Barreras de Accesibilidad:**
- Al aparecer un error de validación, el foco del teclado no se mueve hacia el mensaje de error, por lo que un usuario de lector de pantalla podría no enterarse de por qué no se guardó el formulario.

💡 **Soluciones Accionables:**
- **Animaciones UI:** Cuando se active el check de Inscripción Múltiple, usar una animación suave (ej: Framer Motion o CSS `transition: max-height`) para mostrar la caja de Nación/Provincia y ocultar la del Link Único, en lugar de un cambio brusco de display.
- **Microcopy & Errores:** En lugar del genérico "Error de validación", utilizar un `toast` o banner que liste: *"Te faltó completar: Fecha límite de envío, Enlace de inscripción"*.
- A11y: Añadir `role="alert"` o `aria-live="assertive"` a los mensajes de error globales para que sean anunciados inmediatamente.

---

## 4. Pantalla: Mi Actividad (y Rediseños pendientes)
🟢 **Puntos Fuertes:** 
- Es un excelente recurso para la transparencia y seguridad del sistema.

🔴 **Puntos de Fricción / Carga Cognitiva:** 
- Solucionado: Mostrar JSON crudo a un operador/encargada genera pánico tecnológico (Carga cognitiva altísima).
- No hay forma de saber fácilmente si fue un cambio "bueno" o "peligroso".

**Soluciones Accionables:**
- **Diseño Tabla (UI):** Como sugeriste, la vista debe ser una tabla con columnas: `Fecha | Usuario | Acción | Recurso`. 
- **Microcopy:** En lugar de "Update Campana", mostrar "Editó la campaña: Taller Pymes".
- En lugar de mostrar JSON, poner un botón que diga "Ver detalle de cambios" que abra un modal y allí mostrar un "Antes y Después" amigable (al estilo visualizador de Github pero más simple, o simplemente qué campo cambió de X a Y).

---

## 5. Diseño Emocional y Comodidad (Impresión General)
- **Feedback:** Cuando el usuario envía una campaña masiva o restablece una contraseña, el nivel de ansiedad sube (¿Lo mandé bien? ¿Se envió?). 
- **Solución:** Agregar animaciones de éxito, un check verde rotundo, y correos transaccionales súper profesionales (como el que ya pediste que refinemos sacando banners innecesarios). Los espacios de padding (`py-8`, `px-6`) están muy bien logrados, el sistema "respira" bien.

---

### Conclusión y Siguientes Pasos Prioritarios
1. **Nav/Perfil:** Dar affordance de "botón" a tu perfil y arreglar el cierre en móvil.
2. **Formularios Mágicos (Crear Contacto):** Implementar el autocompletado y reutilización de CUIT / Empresas que mencionaste. Esto eliminará el 90% de la frustración por carga de datos duplicada.

*Si estás de acuerdo con este análisis UX/UI, podemos empezar abordando la mejora de **Crear Contacto (Autocompletado)** y luego pasar al diseño de **Mi Actividad**.*

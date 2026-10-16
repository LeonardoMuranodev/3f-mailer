import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ── Dimensiones (16:9 Widescreen) ──────────────────────────
SLIDE_WIDTH = Inches(13.333)
SLIDE_HEIGHT = Inches(7.5)

# ── Paleta de Colores Municipalidad Tres de Febrero ─────────
C_PRIMARY_BLUE = RGBColor(11, 79, 156)     # Azul 3F (#0B4F9C)
C_DARK_BLUE    = RGBColor(8, 45, 95)       # Azul Noche (#082D5F)
C_LIGHT_BLUE   = RGBColor(224, 242, 254)   # Azul Pastel (#E0F2FE)
C_ACCENT_CYAN  = RGBColor(2, 132, 199)     # Celeste (#0284C7)
C_ACCENT_GOLD  = RGBColor(245, 158, 11)    # Amarillo / Dorado (#F59E0B)
C_BG_LIGHT     = RGBColor(248, 250, 252)   # Fondo Claro (#F8FAFC)
C_CARD_BG      = RGBColor(255, 255, 255)   # Blanco
C_CARD_BORDER  = RGBColor(226, 232, 240)   # Borde Suave (#E2E8F0)
C_TEXT_DARK    = RGBColor(30, 41, 59)      # Gris Carbón (#1E293B)
C_TEXT_MUTED   = RGBColor(100, 116, 139)   # Gris Secundario (#64748B)
C_SUCCESS      = RGBColor(16, 185, 129)    # Verde Éxito (#10B981)
C_DANGER       = RGBColor(239, 68, 68)     # Rojo Error (#EF4444)

# ── Rutas de Recursos ──────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_PATH = os.path.join(BASE_DIR, "client", "src", "assets", "logo-3f.png")
LOGO_COLOR_PATH = os.path.join(BASE_DIR, "client", "src", "assets", "3fcolor.png")
OUTPUT_PPTX = os.path.join(BASE_DIR, "docs", "Presentacion_3F_Mailer_Rol_Encargada.pptx")

prs = Presentation()
prs.slide_width = SLIDE_WIDTH
prs.slide_height = SLIDE_HEIGHT
blank_layout = prs.slide_layouts[6]

def add_header(slide, tag_text, title_text, subtitle_text):
    """Crea la cabecera estándar institucional con badge, título y logo."""
    # Fondo general
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_WIDTH, SLIDE_HEIGHT)
    bg.fill.solid()
    bg.fill.fore_color.rgb = C_BG_LIGHT
    bg.line.fill.background()

    # Barra superior azul sutil
    top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_WIDTH, Inches(0.12))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = C_PRIMARY_BLUE
    top_bar.line.fill.background()

    # Tag / Badge
    tag_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.4), Inches(2.8), Inches(0.35))
    tag_box.fill.solid()
    tag_box.fill.fore_color.rgb = C_LIGHT_BLUE
    tag_box.line.color.rgb = C_ACCENT_CYAN
    tag_tf = tag_box.text_frame
    tag_tf.word_wrap = True
    tag_p = tag_tf.paragraphs[0]
    tag_p.text = tag_text.upper()
    tag_p.font.size = Pt(10)
    tag_p.font.bold = True
    tag_p.font.color.rgb = C_PRIMARY_BLUE
    tag_p.alignment = PP_ALIGN.CENTER

    # Título Principal
    t_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(10.5), Inches(0.6))
    t_tf = t_box.text_frame
    t_tf.word_wrap = True
    t_p = t_tf.paragraphs[0]
    t_p.text = title_text
    t_p.font.size = Pt(22)
    t_p.font.bold = True
    t_p.font.color.rgb = C_DARK_BLUE

    # Subtítulo explicativo
    s_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.35), Inches(10.5), Inches(0.45))
    s_tf = s_box.text_frame
    s_tf.word_wrap = True
    s_p = s_tf.paragraphs[0]
    s_p.text = subtitle_text
    s_p.font.size = Pt(12)
    s_p.font.color.rgb = C_TEXT_MUTED

    # Logo 3F esquina superior derecha
    if os.path.exists(LOGO_PATH):
        slide.shapes.add_picture(LOGO_PATH, Inches(11.8), Inches(0.4), Inches(0.85), Inches(0.85))

    # Footer institucional
    f_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.0), Inches(11.7), Inches(0.35))
    f_tf = f_box.text_frame
    f_p = f_tf.paragraphs[0]
    f_p.text = "Municipalidad de Tres de Febrero — Dirección de Producción | Plataforma 3F Mailer"
    f_p.font.size = Pt(9.5)
    f_p.font.color.rgb = C_TEXT_MUTED

def add_card(slide, left, top, width, height, title, items, badge_color=C_PRIMARY_BLUE, bg_color=C_CARD_BG):
    """Crea una tarjeta contenedora estilizada con sombra y viñetas."""
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    card.line.color.rgb = C_CARD_BORDER
    card.line.width = Pt(1.2)

    # Cabecera de la tarjeta con franja decorativa
    card_header = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(0.08))
    card_header.fill.solid()
    card_header.fill.fore_color.rgb = badge_color
    card_header.line.fill.background()

    tb = slide.shapes.add_textbox(left + Inches(0.25), top + Inches(0.18), width - Inches(0.5), height - Inches(0.3))
    tf = tb.text_frame
    tf.word_wrap = True

    p_title = tf.paragraphs[0]
    p_title.text = title
    p_title.font.size = Pt(15)
    p_title.font.bold = True
    p_title.font.color.rgb = C_DARK_BLUE
    p_title.space_after = Pt(10)

    for item in items:
        p = tf.add_paragraph()
        if isinstance(item, tuple):
            strong_text, normal_text = item
            run1 = p.add_run()
            run1.text = "• " + strong_text + ": "
            run1.font.bold = True
            run1.font.size = Pt(11.5)
            run1.font.color.rgb = C_TEXT_DARK
            run2 = p.add_run()
            run2.text = normal_text
            run2.font.size = Pt(11.5)
            run2.font.color.rgb = C_TEXT_MUTED
        else:
            run = p.add_run()
            run.text = "• " + item
            run.font.size = Pt(11.5)
            run.font.color.rgb = C_TEXT_DARK
        p.space_after = Pt(8)

# ════════════════════════════════════════════════════════════
# SLIDE 1: PORTADA
# ════════════════════════════════════════════════════════════
s1 = prs.slides.add_slide(blank_layout)

# Fondo azul institucional completo
bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_WIDTH, SLIDE_HEIGHT)
bg1.fill.solid()
bg1.fill.fore_color.rgb = C_DARK_BLUE
bg1.line.fill.background()

# Franja dorada decorativa
accent_bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.4), SLIDE_HEIGHT)
accent_bar.fill.solid()
accent_bar.fill.fore_color.rgb = C_ACCENT_GOLD
accent_bar.line.fill.background()

# Logo si existe
if os.path.exists(LOGO_COLOR_PATH):
    s1.shapes.add_picture(LOGO_COLOR_PATH, Inches(1.5), Inches(1.2), Inches(3.2), Inches(1.3))
elif os.path.exists(LOGO_PATH):
    s1.shapes.add_picture(LOGO_PATH, Inches(1.5), Inches(1.2), Inches(1.5), Inches(1.5))

# Título de Portada
t1 = s1.shapes.add_textbox(Inches(1.5), Inches(2.8), Inches(10.5), Inches(2.2))
tf1 = t1.text_frame
tf1.word_wrap = True

p = tf1.paragraphs[0]
p.text = "Plataforma 3F Mailer"
p.font.size = Pt(40)
p.font.bold = True
p.font.color.rgb = RGBColor(255, 255, 255)

p2 = tf1.add_paragraph()
p2.text = "Manual de Operación y Guía Práctica — Rol Encargada"
p2.font.size = Pt(22)
p2.font.color.rgb = C_ACCENT_CYAN
p2.space_before = Pt(8)

p3 = tf1.add_paragraph()
p3.text = "Dirección de Producción | Municipalidad de Tres de Febrero"
p3.font.size = Pt(14)
p3.font.color.rgb = RGBColor(203, 213, 225)
p3.space_before = Pt(16)

# Badge explicativo no técnico
badge1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(5.5), Inches(7.0), Inches(0.8))
badge1.fill.solid()
badge1.fill.fore_color.rgb = RGBColor(15, 30, 60)
badge1.line.color.rgb = C_ACCENT_GOLD
badge1_tf = badge1.text_frame
badge1_p = badge1_tf.paragraphs[0]
badge1_p.text = "🎯 Diseñado para uso operativo diario de las encargadas: claro, simple y sin tecnicismos."
badge1_p.font.size = Pt(12)
badge1_p.font.bold = True
badge1_p.font.color.rgb = RGBColor(254, 243, 199)
badge1_p.alignment = PP_ALIGN.CENTER

# ════════════════════════════════════════════════════════════
# SLIDE 2: ¿QUÉ ES 3F MAILER Y TU ROL?
# ════════════════════════════════════════════════════════════
s2 = prs.slides.add_slide(blank_layout)
add_header(s2, "Introducción Institucional", "¿Qué es 3F Mailer y cuál es tu función?", "La herramienta oficial para conectar al municipio con el sector comercial e industrial de Tres de Febrero.")

add_card(s2, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), "¿Para qué sirve la plataforma?", [
    ("Mailing Oficial", "Envío masivo y prolijo de invitaciones a eventos, capacitaciones, rondas de negocios y anuncios municipales."),
    ("Cuidado de Marca", "Garantiza que todos los correos tengan la estética municipal, membretes oficiales y enlaces seguros."),
    ("Fin de los Mails Manuales", "Reemplaza el envío artesanal de correo por correo, ahorrando horas de trabajo repetitivo."),
    ("Monitoreo en Tiempo Real", "Permite saber exactamente cuántas empresas abrieron el correo y quiénes hicieron clic en los links.")
], badge_color=C_PRIMARY_BLUE)

add_card(s2, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.7), "Tu Rol como Encargada vs Otros Roles", [
    ("Rol Encargada (Tu rol)", "Tenés control total del día a día: redactás campañas, cargás contactos, subís afiches, realizás pruebas y autorizás envíos."),
    ("Rol Invitado", "Solo tiene permiso de lectura. Puede ver estadísticas y números para reportes, pero no puede tocar ni enviar nada."),
    ("Rol Desarrollador", "Se encarga únicamente del mantenimiento técnico del servidor y configuraciones internas."),
    ("Enfoque Práctico", "No necesitás saber programación ni bases de datos. Todo el sistema está pensado para resolver tareas con botones simples.")
], badge_color=C_ACCENT_GOLD)

# ════════════════════════════════════════════════════════════
# SLIDE 3: MENÚ Y NAVEGACIÓN GENERAL
# ════════════════════════════════════════════════════════════
s3 = prs.slides.add_slide(blank_layout)
add_header(s3, "Mapa de la Aplicación", "Menú Principal: Cómo moverte por el sistema", "La barra superior te permite acceder en un clic a cada una de las áreas de trabajo.")

cards_s3 = [
    ("Campañas", [("Tu centro de control", "Listado de correos enviados, en proceso o en borrador. Desde acá creás nuevas campañas.")]),
    ("Estadísticas", [("Impacto global", "Tablero visual con el total de aperturas, clics y alcance acumulado en el tiempo.")]),
    ("Contactos", [("La agenda productiva", "El directorio con todas las empresas, sus correos, CUIT y rubros asignados.")]),
    ("Cuentas de Envío", [("Casillas oficiales", "Las cuentas de correo desde donde el sistema despacha los mensajes en rotación.")]),
    ("Horarios", [("Control de despacho", "Días y horas en los que está permitido mandar mails para no molestar fuera de hora.")]),
    ("Perfil y Soporte", [("Tu cuenta", "Cambio de contraseña personal y canal de contacto para pedir ayuda técnica.")])
]

col_w = Inches(3.65)
row_h = Inches(2.2)
for i, (title, items) in enumerate(cards_s3):
    col = i % 3
    row = i // 3
    x = Inches(0.8) + col * (col_w + Inches(0.35))
    y = Inches(2.0) + row * (row_h + Inches(0.25))
    add_card(s3, x, y, col_w, row_h, title, items, badge_color=C_PRIMARY_BLUE if i < 3 else C_ACCENT_CYAN)

# ════════════════════════════════════════════════════════════
# SLIDE 4: NUEVA CAMPAÑA: PASO A PASO
# ════════════════════════════════════════════════════════════
s4 = prs.slides.add_slide(blank_layout)
add_header(s4, "Creación de Campañas", "Paso a Paso: Diseñando un nuevo envío masivo", "Desde el botón '+ Nueva Campaña', el formulario te guía punto por punto.")

add_card(s4, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), "1. Datos Básicos del Envío", [
    ("Asunto del Correo", "Es lo primero que lee la empresa. Debe ser claro y convocante (Ej: 'Invitación: Ronda de Negocios Minería')."),
    ("Fecha Límite de Envío", "La fecha máxima para mandar los mails. Muy útil para eventos con fecha fija; el sistema nunca mandará mails de un evento ya pasado."),
    ("Prioridad del Envío", "Podés marcar Alta, Media o Baja. Si hay varias campañas activas, el sistema despacha primero las de prioridad Alta."),
    ("Flexibilidad", "Podés cambiar estos datos en cualquier momento mientras la campaña esté en estado Borrador.")
], badge_color=C_PRIMARY_BLUE)

add_card(s4, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.7), "2. Botones de Inscripción / Enlaces", [
    ("Link Único de Inscripción", "Es el caso estándar: un botón principal que lleva a un formulario de inscripción (Google Forms, web, etc.)."),
    ("Links Múltiples (Nación / Provincia)", "Si el programa depende de dos organismos, podés activar esta opción para mostrar dos botones independientes."),
    ("Botones Automáticos", "No necesitás diseñar nada: la app genera botones llamativos con los colores municipales listos para hacer clic."),
    ("Seguridad de Clics", "El sistema contabiliza cuántas empresas tocaron cada botón para que midas el interés real.")
], badge_color=C_ACCENT_CYAN)

# ════════════════════════════════════════════════════════════
# SLIDE 5: FLYERS, ADJUNTOS Y REDACCIÓN
# ════════════════════════════════════════════════════════════
s5 = prs.slides.add_slide(blank_layout)
add_header(s5, "Contenido del Mensaje", "Flyer de Cabecera, Archivos Adjuntos y Texto", "Dale formato profesional al correo con imágenes oficiales y documentos complementarios.")

add_card(s5, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), "Imágenes y Archivos Adjuntos", [
    ("Flyer Oficial de Cabecera", "Subí el afiche o imagen de la capacitación (JPG o PNG). La app lo adapta para que se vea impecable en PC y celulares."),
    ("Archivo Adjunto (Opcional)", "Activá la opción 'Incluir archivo adjunto' para sumar un PDF con el programa, catálogo o presentación."),
    ("Nombre Original Preservado", "El archivo llega al destinatario con su nombre prolijo (ej: 'Programa_Capacitacion.pdf'), sin códigos raros."),
    ("Recomendación de Peso", "Conviene usar PDFs livianos (menos de 5 MB) para que el envío sea rápido y no sature casillas.")
], badge_color=C_ACCENT_GOLD)

add_card(s5, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.7), "Editor Visual de Texto (Tiptap)", [
    ("Escribir como en Word", "Redactás el cuerpo del correo de forma directa con botones para Negrita, Cursiva, Listas y Enlaces."),
    ("Estructura Institucional", "La app rodea tu texto con la cabecera municipal oficial y el pie de página formal sin que tengas que maquetarlo."),
    ("Mensaje de Desuscripción", "Incluye automáticamente el aviso legal para que las empresas puedan solicitar no recibir más comunicaciones si lo desean."),
    ("Espaciado Prolijo", "Garantiza tipografía moderna y lectura cómoda en cualquier programa de correo.")
], badge_color=C_PRIMARY_BLUE)

# ════════════════════════════════════════════════════════════
# SLIDE 6: DESTINATARIOS Y RUBROS
# ════════════════════════════════════════════════════════════
s6 = prs.slides.add_slide(blank_layout)
add_header(s6, "Segmentación de Audiencia", "¿A quiénes le llega el mensaje? (Filtro por Rubro)", "Enviá a toda la comunidad empresarial o segmentá por rubros específicos según la temática.")

add_card(s6, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), "Modo 1: Enviar a Todos los Rubros", [
    ("Un solo clic", "Activás el interruptor 'Enviar a todos los rubros' y la campaña se programa para todas las empresas funcionales de la base."),
    ("Cuándo usarlo", "Para anuncios generales del intendente, ferias masivas, beneficios impositivos globales o festejos comunales."),
    ("Comportamiento", "Llega a empresas de cualquier sector, e incluye también a las que todavía no tienen un rubro especificado.")
], badge_color=C_SUCCESS)

add_card(s6, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.7), "Modo 2: Rubros Específicos + 'Sin Rubro'", [
    ("Selección a medida", "Desmarcás la opción general y tildás únicamente los sectores que te interesan (Metalúrgica, Alimentos, Textil, etc.)."),
    ("Opción 'Sin rubro asignado'", "Te permite incluir a empresas que fueron recién cargadas y aún no fueron catalogadas, para no dejarlas afuera."),
    ("Ahorro de Contactos", "Evita enviar contenido irrelevante a comercios que no tienen que ver con la temática (cuidando el interés del vecino).")
], badge_color=C_PRIMARY_BLUE)

# ════════════════════════════════════════════════════════════
# SLIDE 7: ACCIONES DE SEGURIDAD PREVIAS AL ENVÍO
# ════════════════════════════════════════════════════════════
s7 = prs.slides.add_slide(blank_layout)
add_header(s7, "Seguridad Operativa", "Las 4 Acciones Clave antes de Disparar una Campaña", "Herramientas diseñadas para que la encargada revise todo con tranquilidad y cero riesgo de error.")

cards_s7 = [
    ("💾 Guardar Borrador", [
        ("Trabajo en etapas", "Podés empezar a cargar un flyer o texto y guardarlo para continuar mañana."),
        ("No envía nada", "Queda en pausa en tu listado sin enviar ningún correo a nadie.")
    ]),
    ("👁️ Vista Previa", [
        ("Simulación exacta", "Abre una pantalla que te muestra cómo se va a ver el correo final en el monitor de la empresa."),
        ("Revisión visual", "Ideal para chequear que la imagen no esté cortada y los textos se lean bien.")
    ]),
    ("✉️ Mail de Prueba (⭐ Clave)", [
        ("Disparo a tu casilla", "Hace un envío real inmediato a tu propio correo municipal."),
        ("Verificación final", "Abrís tu Gmail/Outlook y confirmás que el flyer cargue y los botones funcionen.")
    ]),
    ("✅ Aprobar y Enviar", [
        ("Lanzamiento oficial", "Al tocar este botón, la campaña pasa a estado Aprobada."),
        ("Envío automático", "El robot del sistema empieza a despachar los correos según los horarios permitidos.")
    ])
]

col_w = Inches(2.7)
for i, (title, items) in enumerate(cards_s7):
    x = Inches(0.8) + i * (col_w + Inches(0.28))
    add_card(s7, x, Inches(2.0), col_w, Inches(4.7), title, items, badge_color=C_ACCENT_GOLD if i == 2 else (C_SUCCESS if i == 3 else C_PRIMARY_BLUE))

# ════════════════════════════════════════════════════════════
# SLIDE 8: DETALLE DE CAMPAÑA Y COLA DE ENVÍOS
# ════════════════════════════════════════════════════════════
s8 = prs.slides.add_slide(blank_layout)
add_header(s8, "Seguimiento en Vivo", "Detalle de Campaña: La Fila de Envíos en Tiempo Real", "Una vez lanzada, podés entrar a la campaña y monitorear cada correo segundo a segundo.")

add_card(s8, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), "Tarjetas de Estado Inmediato", [
    ("Total Contactos", "Cantidad exacta de empresas asignadas a esta campaña."),
    ("Enviados (Verde)", "Correos que ya salieron con éxito hacia los servidores de destino."),
    ("Pendientes (Amarillo)", "Mails en fila de espera que se están despachando progresivamente."),
    ("Fallidos (Rojo)", "Correos que rebotaron o tuvieron algún impedimento para entregarse."),
    ("Interacciones (Violeta)", "Cantidad de empresas que hicieron clic en los links de inscripción."),
    ("Control de Pausa", "Botón para pausar y reanudar el envío en cualquier instante si hace falta.")
], badge_color=C_PRIMARY_BLUE)

add_card(s8, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.7), "Tabla Fila por Fila y Funciones Útiles", [
    ("Transparencia total", "Ves cada fila con: empresa, email destinatario, estado puntual, fecha y hora de envío."),
    ("Buscador de Correos", "Podés buscar un email específico para confirmarle por teléfono si ya se le envió la invitación."),
    ("Filtro por Estado", "Filtrá para ver solo los que están pendientes o solo los que rebotaron."),
    ("Botón Volver Arriba", "Botón flotante en la esquina inferior derecha para volver arriba suavemente sin tener que scrollear toda la lista."),
    ("Descargar Reporte", "Botón para bajar un Excel/CSV con el detalle de toda la campaña.")
], badge_color=C_ACCENT_CYAN)

# ════════════════════════════════════════════════════════════
# SLIDE 9: ANÁLISIS DE FALLOS Y REBOTES
# ════════════════════════════════════════════════════════════
s9 = prs.slides.add_slide(blank_layout)
add_header(s9, "Diagnóstico Inteligente", "Análisis de Fallos: Entendiendo por qué rebotó un correo", "El sistema no solo marca que hubo un fallo, sino que te explica la causa en lenguaje humano.")

add_card(s9, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), "Los Motivos de Fallo más Comunes", [
    ("Cancelado", "Mails que quedaron sin enviar porque la campaña fue cancelada o frenada intencionalmente."),
    ("Dominio Inexistente", "La empresa cerró esa casilla o la página web ya no existe (ej: @empresa.com.ar dada de baja)."),
    ("Casilla Llena", "La empresa no vació su buzón de entrada y su proveedor rechaza nuevos correos."),
    ("Rechazado por Spam", "El servidor de la empresa tiene filtros de seguridad corporativos muy restrictivos."),
    ("Email Mal Escrito", "El contacto tenía un error de tipeo (ej: @gmai.com o espacios de más)."),
    ("Otros", "Impedimentos temporales de conexión entre servidores.")
], badge_color=C_DANGER)

add_card(s9, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.7), "¿Qué hace la app automáticamente?", [
    ("Aislamiento inteligente", "La app detecta el motivo y cataloga el contacto para no insistirle en futuros envíos."),
    ("Protección de la Municipalidad", "Si insistimos en enviar mails a casillas que no existen, Gmail o Outlook pueden marcar las casillas municipales como sospechosas."),
    ("Limpieza Progresiva", "Con cada campaña, la base de datos municipal se vuelve más limpia, saludable y efectiva."),
    ("Porcentajes Claros", "En la pestaña 'Estadísticas' de la campaña ves las tarjetas con el porcentaje exacto de cada motivo.")
], badge_color=C_SUCCESS)

# ════════════════════════════════════════════════════════════
# SLIDE 10: DIRECTORIO DE CONTACTOS
# ════════════════════════════════════════════════════════════
s10 = prs.slides.add_slide(blank_layout)
add_header(s10, "Base de Datos", "Directorio de Contactos: El Corazón del Sistema", "La agenda viva con todas las empresas, comercios y profesionales de Tres de Febrero.")

add_card(s10, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), "Los Datos de Cada Contacto", [
    ("Razón Social / Empresa", "Nombre formal o fantasía del comercio o industria."),
    ("Correo Electrónico", "La casilla de contacto principal de la empresa."),
    ("CUIT (Totalmente Flexible)", "Puede tener CUIT formal de 11 dígitos, o puede dejarse sin CUIT con el nuevo botón 'Dejar sin CUIT'."),
    ("Rubro Asignado", "Sector productivo (Metalúrgica, Alimentos, Comercio, Servicios, etc.)."),
    ("Filtro por Rubro", "El buscador incluye la opción 'Sin Rubro' para detectar rápidamente contactos que necesitan ser categorizados.")
], badge_color=C_PRIMARY_BLUE)

add_card(s10, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.7), "Los Estados de un Contacto", [
    ("Funcional (Verde)", "Contacto sano y activo. Recibirá todas las campañas que coincidan con su rubro."),
    ("Inactivo (Gris)", "Contacto pausado temporalmente (no se le enviarán campañas hasta que se reactive)."),
    ("Rebotado Inexistente (Rojo)", "El sistema confirmó que la casilla ya no existe. Se lo aparta automáticamente."),
    ("Rebotado Bandeja Llena (Naranja)", "La casilla está saturada."),
    ("Mail Mal Escrito (Rosa)", "La dirección tiene errores de sintaxis y requiere corrección manual.")
], badge_color=C_ACCENT_GOLD)

# ════════════════════════════════════════════════════════════
# SLIDE 11: LAS 3 FORMAS DE CARGAR CONTACTOS
# ════════════════════════════════════════════════════════════
s11 = prs.slides.add_slide(blank_layout)
add_header(s11, "Ingreso de Datos", "Las 3 Maneras de Importar Contactos", "Cargá empresas una por una, subí archivos Excel/CSV o sincronizá directamente desde la nube.")

add_card(s11, Inches(0.8), Inches(2.0), Inches(3.6), Inches(4.7), "1. Carga Individual", [
    ("Botón '+ Crear Contacto'", "Para cuando te pasan una empresa nueva por teléfono o WhatsApp."),
    ("Autocompletado inteligente", "Si empezás a escribir el nombre o CUIT de una empresa ya existente, la app te sugiere sus datos para no duplicar."),
    ("Validación amigable", "Verifica que el mail esté bien escrito.")
], badge_color=C_PRIMARY_BLUE)

add_card(s11, Inches(4.8), Inches(2.0), Inches(3.6), Inches(4.7), "2. Importar Archivo CSV", [
    ("Carga Masiva", "Para subir listas generadas en Excel."),
    ("Asistente visual", "La app te muestra una vista previa antes de guardar."),
    ("Detección de duplicados", "Si un correo ya existía, no lo pisa ni genera errores.")
], badge_color=C_ACCENT_CYAN)

add_card(s11, Inches(8.8), Inches(2.0), Inches(3.7), Inches(4.7), "3. Sincronizar Sheets (⭐ Clave)", [
    ("Un solo botón verde", "Tocás 'Sincronizar con Sheets' y listo."),
    ("Conexión con el Drive", "Trae en tiempo real las altas y modificaciones que hace el equipo en el Google Sheets oficial."),
    ("Tolerancia a fallos", "Si una fila tiene un error de tipeo, no frena la importación: procesa las 2.000 filas restantes sin problemas.")
], badge_color=C_SUCCESS)

# ════════════════════════════════════════════════════════════
# SLIDE 12: ESTADÍSTICAS GENERALES Y MÉTRICAS
# ════════════════════════════════════════════════════════════
s12 = prs.slides.add_slide(blank_layout)
add_header(s12, "Rendimiento y Reportes", "Métricas Globales: ¿Qué representa cada número?", "Tablero general para medir el éxito y alcance de la Dirección de Producción.")

add_card(s12, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), "Las Métricas Principales", [
    ("Tasa de Apertura (Open Rate)", "Porcentaje de personas que abrieron el correo. Un número superior al 25-30% indica un excelente interés en la convocatoria."),
    ("Tasa de Clics (Click Rate)", "Porcentaje de personas que hicieron clic en el botón de inscripción. Mide el interés real en participar."),
    ("Tasa de Rebotes (Fallos)", "Porcentaje de correos que no pudieron entregarse. Mientras más bajo sea este número, más sana está la base."),
    ("Envíos Acumulados", "El volumen histórico total despachado por el municipio.")
], badge_color=C_PRIMARY_BLUE)

add_card(s12, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.7), "Filtros y Utilidad para Informes", [
    ("Filtro por Período", "Podés consultar estadísticas de los 'Últimos 7 días', 'Este mes', o 'Personalizado' para armar informes mensuales de gestión."),
    ("Filtro por Rubro", "Descubrí qué sectores son los más activos y participativos en las convocatorias municipales."),
    ("Exportación", "Información lista para capturar en reportes para autoridades o secretaría."),
    ("Actualización Automática", "Los números se refrescan solos a medida que los destinatarios interactúan con los correos.")
], badge_color=C_ACCENT_GOLD)

# ════════════════════════════════════════════════════════════
# SLIDE 13: CUENTAS DE ENVÍO (SMTP) Y HORARIOS
# ════════════════════════════════════════════════════════════
s13 = prs.slides.add_slide(blank_layout)
add_header(s13, "Infraestructura Segura", "Cuentas de Envío y Control de Horarios", "Cómo cuida la aplicación las casillas municipales y respeta los tiempos de las empresas.")

add_card(s13, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), "Cuentas de Envío (Vistas por arriba)", [
    ("Múltiples Casillas Oficiales", "La app utiliza varias cuentas de Gmail municipales autorizadas para repartir el trabajo."),
    ("Rotación Inteligente", "Si tenés que mandar 1.000 mails, no salen todos de la misma cuenta: la app los alterna entre las cuentas activas."),
    ("Cuidado de Límites Diarios", "Cada cuenta tiene un cupo máximo por día (ej: 450 mails). Si una cuenta llega a su límite, descansa y el sistema sigue con las demás."),
    ("¿Qué debe hacer la encargada?", "Solo verificar que las cuentas figuren en verde ('Activa'). Del balanceo se ocupa la app.")
], badge_color=C_PRIMARY_BLUE)

add_card(s13, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.7), "Control de Horarios de Despacho", [
    ("Respeto Institucional", "El municipio no envía correos de madrugada ni los domingos."),
    ("Franja Horaria Laboral", "El sistema está configurado para despachar de Lunes a Viernes de 09:00 a 17:00 hs."),
    ("¿Qué pasa si apruebo a las 20:00 hs?", "La campaña queda guardada en espera de forma segura y comienza a salir sola a las 09:00 hs del día siguiente."),
    ("Tranquilidad", "Podés armar tus campañas en cualquier momento sin preocuparte por la hora de salida.")
], badge_color=C_SUCCESS)

# ════════════════════════════════════════════════════════════
# SLIDE 14: PERFIL, SEGURIDAD Y SOPORTE
# ════════════════════════════════════════════════════════════
s14 = prs.slides.add_slide(blank_layout)
add_header(s14, "Tu Cuenta y Ayuda", "Perfil de Usuario y Canal de Soporte", "Gestión de tu acceso personal y cómo actuar ante cualquier duda.")

add_card(s14, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), "Mi Perfil y Contraseña", [
    ("Tus Datos", "Accedé desde la esquina superior derecha para ver tu nombre, email y rol activo ('Encargada')."),
    ("Cambio de Contraseña Autónomo", "Podés actualizar tu clave en cualquier momento ingresando tu contraseña actual y la nueva."),
    ("Requisitos de Seguridad", "La app te pide una clave segura con letras y números para proteger el acceso."),
    ("Recuperar Clave", "Si alguna vez te la olvidás, desde la pantalla de login podés tocar 'Olvidé mi contraseña' y te llega un link a tu correo.")
], badge_color=C_PRIMARY_BLUE)

add_card(s14, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.7), "Soporte Técnico y Ayuda", [
    ("Módulo de Soporte", "Desde el menú 'Soporte' podés consultar preguntas frecuentes y guías operativas."),
    ("Reporte de Inconvenientes", "Si alguna cuenta de correo se desconfigura o necesitás sumar una nueva funcionalidad, podés solicitar asistencia directa."),
    ("Auditoría Interna", "El sistema guarda un registro transparente de cada acción para que nunca haya dudas de cuándo o quién lanzó cada campaña.")
], badge_color=C_ACCENT_CYAN)

# ════════════════════════════════════════════════════════════
# SLIDE 15: DECÁLOGO DE BUENAS PRÁCTICAS
# ════════════════════════════════════════════════════════════
s15 = prs.slides.add_slide(blank_layout)
add_header(s15, "Recomendaciones Finales", "El Decálogo de la Encargada: Claves para el Éxito", "Pequeños hábitos diarios que aseguran un funcionamiento perfecto y profesional.")

add_card(s15, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7), "Antes de Lanzar una Campaña", [
    ("1. Enviar siempre Mail de Prueba", "Revisalo en tu propio teléfono y compu antes de apretar 'Aprobar'."),
    ("2. Probar los Botones", "Hacé clic en el botón de inscripción del mail de prueba y comprobá que abra el formulario correcto."),
    ("3. Verificar la Fecha Límite", "Asegurate de que la fecha límite coincida con el evento."),
    ("4. Sincronizar Sheets periódicamente", "Antes de un envío importante, dale clic a 'Sincronizar con Sheets' para tener las últimas empresas cargadas.")
], badge_color=C_ACCENT_GOLD)

add_card(s15, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.7), "Durante y Después del Envío", [
    ("5. No desesperar por la velocidad", "Los correos salen con pausas calculadas para que los servidores de Google no los bloqueen."),
    ("6. Chequear la Cola de Envíos", "Si necesitás frenar, usá el botón 'Pausar' con total tranquilidad."),
    ("7. Medir a las 48 Horas", "Las empresas suelen abrir los mails entre 24 y 48 horas después del despacho."),
    ("8. Mantener la Base Saludable", "Si te avisan de un cambio de correo, actualizalo en la planilla o en la app para el futuro.")
], badge_color=C_SUCCESS)

# Guardar la presentación
os.makedirs(os.path.dirname(OUTPUT_PPTX), exist_ok=True)
prs.save(OUTPUT_PPTX)
print(f"[OK] Presentacion guardada exitosamente en: {OUTPUT_PPTX}")

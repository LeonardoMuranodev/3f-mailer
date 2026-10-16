# Directiva SOP: Generación de Presentación Institucional (Rol Encargada)

## Objetivo
Generar un archivo PowerPoint (`.pptx`) con diseño institucional de la Municipalidad de Tres de Febrero, destinado a capacitar al personal que asuma el rol de **Encargada** en la plataforma **3F Mailer**.
El lenguaje debe ser estrictamente accesible, práctico y orientado a tareas diarias operativas, evitando terminología técnica o de programación (como hashes, JWT o arquitecturas internas).

## Paleta y Estilo Visual Institucional (Tres de Febrero)
- **Azul Primario 3F:** `#0B4F9C` (encabezados, tarjetas maestras, barras de títulos)
- **Azul Profundo Municipal:** `#082D5F` (fondos oscuros, portada, pie institucional)
- **Dorado / Amarillo Acción:** `#F59E0B` (badges de estado, llamadas a la acción, destacados)
- **Celeste / Acento:** `#0284C7` (bordes decorativos, iconos de contexto)
- **Fondo General:** `#F8FAFC` (gris perla suave para legibilidad y elegancia)
- **Tipografía:** Calibri / Trebuchet MS en tamaños grandes (18 a 32 pt) con contraste visual alto.
- **Relación de Aspecto:** Panorámica 16:9 (`13.33 x 7.5` pulgadas).
- **Logos oficiales:** Utilizar los archivos de imagen oficiales `client/src/assets/logo-3f.png` y/o `client/src/assets/3fcolor.png`.

## Temario y Estructura de Diapositivas
1. **Portada Institucional:** Título, bajada ("Manual Visual y Guía Operativa"), logo y rol Encargada.
2. **Tu Rol como Encargada:** Diferencia entre Encargada (crear, segmentar, pausar, enviar, gestionar) e Invitado (solo lectura de métricas).
3. **El Mapa de la Plataforma:** Menú lateral, accesos rápidos y secciones de trabajo.
4. **Nueva Campaña — Paso 1:** Asunto atractivo, fecha límite de entrega y prioridad.
5. **Nueva Campaña — Paso 2:** Imagen flyer de cabecera, archivos adjuntos en PDF/imágenes y redacción con texto enriquecido.
6. **Nueva Campaña — Paso 3 (Enlaces):** Botón principal único vs botones diferenciados (Nación / Provincia).
7. **Nueva Campaña — Paso 4 (Segmentación):** Selección por Rubros industriales/comerciales y envío a empresas "Sin Rubro Asignado".
8. **Nueva Campaña — Paso 5 (El Cuarteto de Seguridad):** Guardar Borrador, Vista Previa real, Envío de Prueba a tu casilla y Aprobación final.
9. **Detalle de Campaña y Cola de Envíos:** Monitoreo en tiempo real, estados de envío y botón rápido para volver arriba.
10. **Comprensión de Fallos y Rebotes:** Casilla cancelada, correo inexistente, buzón lleno y protección antispam.
11. **Directorio de Contactos:** Información centralizada de empresas, validación flexible de CUIT (opcional) y estados activo/inactivo.
12. **Importación y Carga de Contactos:** Carga manual con ayuda inteligente, importación masiva por Excel/CSV y enlace en vivo con Google Sheets.
13. **Lectura de Estadísticas y Resultados:** Qué significan los envíos totales, tasa de apertura, clics únicos y rebotes.
14. **Cuentas de Envío y Horarios Municipales:** Rotación de casillas para cuidar la reputación y respeto estricto del horario laboral (9 a 17 hs).
15. **Perfil, Soporte y Decálogo de Buenas Prácticas:** Gestión de contraseña personal, canal de soporte interno y checklist previo a cada campaña.

## Entradas y Salidas
- **Entrada:** `scripts/generar_presentacion_encargada.py` (Script de automatización en Python usando `python-pptx`).
- **Salida esperada:** `docs/Presentacion_3F_Mailer_Rol_Encargada.pptx`.

## Restricciones y Casos Borde
- **Enfoque comunicacional:** Cada concepto técnico debe traducirse a su equivalente funcional de oficina municipal.
- **Formato de tarjetas:** Evitar muros de texto; utilizar bloques tipo tarjeta (`Card`), badges de color y viñetas con espaciado amplio.
- **Librería de presentación:** Ejecutar con Python 3 (`py -3` en Windows) garantizando que `python-pptx` y `Pillow` procesen adecuadamente los logos transparentes PNG.
- **Nota de Memoria (Codificación de Consola):** En entornos Windows con consola `cp1252`, no imprimir caracteres emoji en `stdout` (ej. `\u2705`) directamente sin configurar `sys.stdout.reconfigure(encoding='utf-8')`, o usar prefijos de texto estándar como `[OK]` para evitar `UnicodeEncodeError`.

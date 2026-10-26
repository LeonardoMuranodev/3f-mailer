# Fase 23: Flyer Opcional y Exportación de Estadísticas a PDF con Gráficos

## 📋 Resumen de la Fase
Se implementaron dos requerimientos fundamentales para la experiencia de la encargada en la plataforma:
1. Permitir que las campañas se creen, guarden como borrador y aprueben **sin requerir obligatoriamente una imagen de flyer**, incorporando un aviso de confirmación preventivo si se intenta aprobar sin flyer.
2. Posibilitar la **exportación del informe completo de estadísticas a formato PDF nativo** preservando todos los gráficos visuales (donut conic-gradient, barras de estado, métricas de rubros y ranking) y membrete formal municipal.

---

## 🛠️ Detalle de Implementación

### Tarea 1: Flyer Opcional con Modal Preventivo

#### 1. Backend (`src/controllers/campanaController.ts`)
- Se removió la validación restrictiva `if (!flyer_url)` en el endpoint `POST /api/campanas` que respondía con código 400.
- Si no se carga ningún archivo ni se envía URL previa, se guarda `flyer_url: null` en la base de datos PostgreSQL.
- En la actualización (`PUT /api/campanas/:id`), cualquier string vacío `""` o ausencia de archivo también se normaliza a `null`, permitiendo quitar flyers de borradores existentes.
- El motor de correos (`emailTemplate.ts` y `emailWorker.ts`) ya maneja condicionalmente la ausencia de flyer sin renderizar bloques vacíos ni provocar fallas en los envíos.

#### 2. Frontend (`client/src/components/CrearCampana.tsx`)
- Se modificó la etiqueta del campo de `Flyer adjunto *` a `Flyer adjunto (Opcional)` eliminando el asterisco rojo de obligatoriedad.
- En el modal de ayuda se añadió una tarjeta descriptiva indicando que el flyer es un elemento visual opcional.
- Se implementó el modal preventivo de confirmación:
  - Al pulsar **"Aprobar y Enviar"**, se verifica si existe un archivo o URL de flyer cargado.
  - Si **no hay flyer**, se abre el modal:
    - *"¿Enviar campaña sin Flyer? No has adjuntado una imagen de flyer a esta campaña. Los destinatarios recibirán el comunicado únicamente con el texto redactado y los enlaces correspondientes."*
    - Opciones: **"Volver a editar"** o **"Continuar sin Flyer"**.
  - Si **hay flyer**, procede de forma directa sin interrupción.
- Al pulsar **"Guardar Borrador"**, se almacena inmediatamente sin solicitar confirmación.

---

### Tarea 2: Exportar Informe de Estadísticas a PDF con Gráficos

#### 1. Frontend (`client/src/components/EstadisticasGenerales.tsx`)
- Se incorporó el botón **"Exportar PDF"** junto al botón existente de "Exportar CSV", identificado con el icono `Printer` y estilo primario.
- Función `handleExportPdf`:
  - Asigna temporalmente el nombre del archivo al título del documento (ej. `Informe_Estadisticas_3F_Mailer_2026-10-16.pdf`).
  - Lanza `window.print()` abriendo el diálogo nativo de guardado/impresión del navegador.
  - Restaura automáticamente el título original tras la operación.
- **Membrete Oficial Impreso:**
  - Se añadió un encabezado formal institucional exclusivo para impresión (`hidden print:block`), conteniendo el logo oficial de la Municipalidad de Tres de Febrero, leyenda de "Dirección de Producción • 3F Mailer", badge de "Reporte Oficial", fecha y hora de emisión y rango de fechas analizado.
- **Pie de Página Oficial Impreso:**
  - Leyenda institucional al pie del informe de cierre.
- **Exclusión de Controles:**
  - Se marcaron la barra de navegación, botones de acción, filtros por fecha y modales con la clase `no-print`.

#### 2. Estilos de Impresión (`client/src/index.css`)
- Se configuraron reglas `@media print` especializadas:
  - Formato de página `@page { size: A4 portrait; margin: 10mm 12mm 12mm 12mm; }`.
  - Forzado de colores exactos y fidelidad gráfica con `print-color-adjust: exact` y `-webkit-print-color-adjust: exact`.
  - Adaptación forzada de fondo blanco y texto oscuro nítido incluso cuando el usuario tiene activo el Modo Oscuro (`html.dark`).
  - Prevención de cortes de página desprolijos en tarjetas y gráficos con `break-inside: avoid`.
  - Eliminación de barras de desplazamiento internas (`overflow: visible !important`).

#### 3. Ajustes y Refinamientos Visuales de Front
- **Tabla de Ranking de Campañas:** Se compactó el padding horizontal (`px-2 py-2`), se centraron las columnas numéricas y de efectividad, y se delimitó el ancho máximo del asunto. Con esto la columna `Total errores` encaja 100% holgada sin cortarse en pantallas ni en PDF.
- **Modal "Sin Flyer" en Modo Claro (`.badge-warning-light`):** Se definió una clase CSS específica para evitar problemas de resolución en Tailwind v4. En modo claro luce un fondo amarillo pastel luminoso (`#FEF9C3`), un contorno dorado suave (`#FDE047`) y un icono ámbar vibrante (`#D97706`). En modo oscuro mantiene fielmente su fondo translúcido (`rgba(120, 53, 15, 0.3)`) y color ámbar brillante (`#FBBF24`).
- **Distribución de KPIs en 2 Filas de 3 Columnas (`print:grid-cols-3`):** Para garantizar que etiquetas compuestas como "DESPACHADOS" o "TASA DE ENTREGA" tengan amplitud total sin truncarse jamás, las 6 métricas se presentan en dos filas balanceadas:
  - Fila superior: *Campañas*, *Despachados*, *Pendientes*.
  - Fila inferior: *Tasa de Entrega*, *Aperturas*, *Clics*.
  - Cada tarjeta cuenta con más de 220px de ancho disponible, etiqueta destacada en `text-[11px]` e icono a la derecha sin desbordes.
- **Reporte Ejecutivo en 1 Sola Hoja Equilibrada (One-Pager):** Se unificó todo el contenido dentro de `.print-report-container` (`break-inside: avoid; padding: 10mm 14mm 8mm 14mm`):
  - Membrete institucional oficial de Tres de Febrero con fecha y período.
  - Grilla de 6 KPIs en 2 filas de 3 (3 arriba, 3 abajo) con espacio holgado.
  - Gráfico de *Campañas por Estado* y gráfico circular donut de *Salud del Padrón y Contactos* (lado a lado).
  - *Impacto por Rubro (Top 10)* en grilla de 2 columnas.
  - Tabla de *Ranking de Campañas* con anchos proporcionados.
  - Pie de página institucional que integra *"Desarrollado por el equipo de Tecno 3F"*.
  - Separación vertical ampliada (`gap-3.5`, `mb-4`) para distribuir el contenido de manera uniforme y elegante en **exactamente 1 hoja**.

---

## 🔒 Estado de Git
- **Todos los cambios se encuentran exclusivamente en el entorno local (sin git push)** para su validación previa.

# SOP: Cálculo Dinámico de Envíos y Días Operativos

## 1. Objetivo
Definir y estandarizar el cálculo del lote de despacho horario (`objetivoGlobalHora`) del worker SMTP. El cálculo debe ser matemáticamente determinista y considerar únicamente los días operativos laborales reales (excluyendo fines de semana según `configuracion_horarios` y feriados de `fechas_excluidas`), adaptándose instantáneamente ante cualquier modificación de fecha límite.

---

## 2. Parámetros de Entrada
- **`totalPendientes`**: Cantidad de destinatarios en estado `pendiente` de la campaña.
- **`fechaLimite`**: Fecha límite de entrega/evento (`YYYY-MM-DD` o ISO).
- **`fechaActual`**: Fecha/hora actual en zona horaria `America/Argentina/Buenos_Aires`.
- **`diasPermitidos`**: Días de la semana habilitados para envíos (1 = Lunes, 7 = Domingo). Por defecto: `[1, 2, 3, 4, 5]`.
- **`fechasExcluidas`**: Lista de feriados y días inhábiles en formato `YYYY-MM-DD`.
- **`horaInicio`** y **`horaFin`**: Franja horaria de despacho (ej. `09:00` a `17:00`).
- **`minGlobalPorHora`** y **`maxGlobalPorHora`**: Suma de las capacidades configuradas en las cuentas SMTP activas.

---

## 3. Lógica del Cálculo Paso a Paso

1. **Obtener días operativos reales entre `fechaActual` y `fechaLimite`:**
   - Iterar día por día desde la fecha actual hasta la fecha límite (inclusive).
   - Por cada día:
     - Obtener día de la semana (1 = Lunes ... 7 = Domingo).
     - Si el día no pertenece a `diasPermitidos`, omitir (fin de semana o no laborable).
     - Si la fecha (`YYYY-MM-DD`) está en `fechasExcluidas`, omitir (feriado).
     - En caso contrario, sumar `+1` a `diasOperativos`.
   - **Garantía:** Si `diasOperativos < 1`, fijar en `1` (evita división por cero y cubre campañas para el día de hoy o vencidas).

2. **Calcular ejecuciones operativas diarias:**
   - Horas entre `horaInicio` y `horaFin` inclusive (ej. de 9 a 17 hs = 9 ejecuciones diarias).

3. **Cálculo de la cuota por hora necesaria:**
   $$\text{totalEjecuciones} = \text{diasOperativos} \times \text{ejecucionesDiarias}$$
   $$\text{objetivoCalculado} = \left\lceil \frac{\text{totalPendientes}}{\text{totalEjecuciones}} \right\rceil$$

4. **Poda de seguridad (Clamp):**
   - El objetivo calculado no puede ser inferior a `minGlobalPorHora`.
   - El objetivo calculado no puede superar `maxGlobalPorHora` bajo ninguna circunstancia (preservación de reputación SMTP).

---

## 4. Casos Borde y Trampas Conocidas

- **Trampa 1 (Fines de semana y saltos de calendario):**
  - *Problema:* Restar días calendario directamente (`Math.ceil((evento - hoy) / 86400000)`) asume que el worker trabaja los sábados y domingos.
  - *Regla:* Nunca usar días calendario; siempre iterar y filtrar contra `diasPermitidos` y `fechasExcluidas`.
- **Trampa 2 (Adelanto de fecha):**
  - Si una campaña se adelanta, `diasOperativos` se reduce $\rightarrow$ el lote por hora aumenta automáticamente.
- **Trampa 3 (Postergación de fecha):**
  - Si una campaña se extiende a una fecha más lejana, `diasOperativos` aumenta $\rightarrow$ el lote por hora se reduce hasta el mínimo seguro.
- **Trampa 4 (Cuota máxima alcanzada):**
  - Si una campaña tiene 1.000 pendientes y faltan 2 horas, el cálculo requeriría 500 correos/hora. Sin embargo, si el `maxGlobalPorHora` es 25, debe topar estrictamente en 25 para evitar el baneo de Google.

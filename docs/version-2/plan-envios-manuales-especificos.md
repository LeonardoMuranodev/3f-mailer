Viewed campanaService.ts:1-100
Searched for "cola_envios"
Searched for "INSERT INTO cola_envios"
Viewed queueService.ts:50-140
Viewed emailWorker.ts:180-260

Es una excelente idea de producto y arquitectura. Resolver este caso de uso le va a dar muchísima tranquilidad a las encargadas: pueden mandar notas oficiales o invitaciones especiales a 10 o 50 personas puntuales desde la cuenta principal (`dpim3f@gmail.com`), mientras en paralelo el sistema sigue mandando una campaña masiva de 3.000 mails por las otras cuentas (DPI 2, DPI 3, DPI 4) sin pisarse ni quemar la cuenta principal.

A continuación te presento el **plan de diseño y arquitectura** para esta funcionalidad:

---

## 1. Arquitectura y Reglas del Negocio

1. **Destinatarios manuales (Lista ad-hoc):**
   * En lugar de filtrar por rubro, la encargada elige la opción **"Destinatarios específicos"**.
   * Pega o tipea una lista de correos (separados por coma, punto y coma o saltos de línea).
   * La UI valida el formato de cada correo en tiempo real, elimina duplicados y muestra un contador claro (ej: *"18 destinatarios detectados"*).
2. **Cuenta emisora exclusiva (DPI 1):**
   * Esta campaña queda **fijada a la cuenta DPI 1** (`dpim3f@gmail.com`).
   * La cuenta DPI 1 se marca como **"Uso exclusivo / Institucional"**, lo que significa que **las campañas masivas generales nunca la van a usar** para su rotación.
3. **Concurrencia real (Dos campañas al mismo tiempo):**
   * En la tabla `cola_envios` conviven correos de ambas campañas.
   * Cuando el worker toma un correo de la campaña manual, **lo despacha con DPI 1**.
   * Cuando toma un correo de la campaña masiva, **lo despacha con el Round-Robin de las demás cuentas**.
   * Ambas campañas avanzan en simultáneo sin bloquearse ni gastarse la cuota mutua.

---

## 2. Modificaciones en Base de Datos (PostgreSQL)

### A. En la tabla `cuentas_smtp`:
Agregamos una columna booleana para declarar cuentas reservadas:
```sql
ALTER TABLE cuentas_smtp 
ADD COLUMN IF NOT EXISTS es_exclusiva BOOLEAN DEFAULT false;

-- Marcamos dpim3f@gmail.com (DPI 1) como exclusiva
UPDATE cuentas_smtp 
SET es_exclusiva = true 
WHERE email ILIKE 'dpim3f@gmail.com';
```

### B. En la tabla `campanas`:
Agregamos el tipo de audiencia y la cuenta asignada:
```sql
ALTER TABLE campanas 
ADD COLUMN IF NOT EXISTS tipo_audiencia VARCHAR(20) DEFAULT 'rubros', -- 'rubros' | 'manual'
ADD COLUMN IF NOT EXISTS destinatarios_manuales JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cuenta_emisor_id UUID REFERENCES cuentas_smtp(id);
```

---

## 3. Lógica del Backend y Worker (`emailWorker.ts` / `queueService.ts`)

### A. Selección de cuentas masivas (Rotación Round-Robin):
Modificamos `obtenerSiguienteSmtpDisponible()` para que **excluya las cuentas exclusivas**:
```sql
SELECT *
FROM cuentas_smtp
WHERE estado = 'activo'
  AND enviados_hoy < limite_diario
  AND es_exclusiva = false   -- DPI 1 queda protegida y no rota acá
ORDER BY ultimo_uso ASC NULLS FIRST
LIMIT 1;
```

### B. En `queueService.ts` (Al aprobar la campaña):
* Si `campana.tipo_audiencia === 'manual'`:
  1. Se leen los correos del array `campana.destinatarios_manuales`.
  2. Si alguno de esos correos no existe en la tabla `contactos`, se hace un `INSERT ... ON CONFLICT DO NOTHING` automático para registrarlo (así mantiene tracking de apertura, clics y estadísticas estándar).
  3. Se insertan esos contactos en `cola_envios`.

### C. En el Worker (`emailWorker.ts`):
Al procesar cada email del lote:
```typescript
let cuentaSmtp: CuentaSmtp | null = null;

if (item.campana_cuenta_emisor_id) {
  // Campaña con cuenta fijada (DPI 1)
  cuentaSmtp = await obtenerSmtpPorIdConCuota(item.campana_cuenta_emisor_id);
} else {
  // Campaña masiva general (rotación normal entre DPI 2, DPI 3, DPI 4...)
  cuentaSmtp = await obtenerSiguienteSmtpDisponible();
}
```
*Si DPI 1 alcanza su cuota del día, la campaña manual se pausa o espera al día siguiente a las 09:00, sin afectar a la campaña masiva que sigue corriendo por sus otros canales.*

---

## 4. Diseño de la Interfaz (Frontend React)

### En `CrearCampana.tsx` (Paso de Audiencia):
Agregamos un selector toggle simple y visual:
* 🔘 **Por Rubros de Empresas** (Comportamiento habitual con selector de rubros).
* 🔘 **Lista manual de correos específicos**:
  * Un cuadro de texto (textarea) con placeholder:
    ```text
    Pegá los correos aquí separados por coma o salto de línea:
    intendente@tresdefebrero.gob.ar,
    secretaria@empresa.com
    ```
  * Debajo, **chips visuales** en tiempo real:
    * 🟢 *12 correos válidos detectados*
    * 🟡 *2 correos duplicados eliminados*
    * 🔴 *1 correo con formato inválido descartado*
  * Un cartel informativo:
    > ℹ️ **Cuenta emisora:** Esta campaña se despachará exclusivamente desde la cuenta institucional **dpim3f@gmail.com (DPI 1)**.

### En `DetalleCampana.tsx` y `ListaCampanas.tsx`:
* Badge visual: `Audiencia: Manual (12 destinatarios)` vs `Audiencia: Rubros (1.450 contactos)`.
* Indicador de emisor: `Emisor: dpim3f@gmail.com (DPI 1)`.

---

## 5. Ventajas de esta solución

1. **Cero riesgo para DPI 1:** La cuenta principal de la municipalidad queda 100% blindada de las campañas masivas. Solo manda los correos que las encargadas deciden a dedo.
2. **Concurrencia transparente:** Pueden mandar un comunicado masivo de 4.000 emails y a la vez mandar 15 invitaciones VIP desde DPI 1 sin que se mezclen ni se frenen.
3. **Mantiene todo lo existente:** No rompe las campañas actuales, ni el tracking de clics, ni los flyers, ni los múltiples adjuntos, ni las estadísticas.

---

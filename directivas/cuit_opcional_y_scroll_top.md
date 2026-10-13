# SOP: Manejo de Contactos Sin CUIT y Botón "Volver Arriba" en Cola de Envíos

## Objetivo
1. **Flexibilización de CUIT en Contactos**: Permitir que un contacto se guarde o edite sin CUIT (vaciando el campo o usando un botón "Dejar sin CUIT"). Si el campo está vacío, omitir cualquier validación matemática o de longitud, persistiendo `cuit = NULL` en base de datos.
2. **Botón "Volver Arriba" en Detalle de Campaña / Cola de Envíos**: Proveer un botón flotante visible cuando el usuario scrollea hacia abajo en la lista o tabla de envíos para regresar de forma fluida a la parte superior y volver a visualizar las métricas y estadísticas.

---

## 1. CUIT Opcional y Desvinculación de CUIT

### Frontend (`DirectorioContactos.tsx`)
- En el modal de Crear/Editar contacto:
  - Al lado del label `CUIT`, agregar un botón estilizado: `"Dejar sin CUIT"` o `"Quitar CUIT"` (visible si tiene algún valor en CUIT).
  - Al hacer clic, limpia `form.cuit = ''`.
  - En la validación antes de guardar (`handleGuardar`):
    - Si `form.cuit` está vacío o solo contiene espacios, **no validar algoritmo módulo 11 ni exigir 11 dígitos**.
    - El payload a enviar debe incluir `cuit: form.cuit?.trim() ? form.cuit.trim() : null`.

### Backend (`src/schemas/contactoSchema.ts` y `src/services/contactoService.ts`)
- En `src/schemas/contactoSchema.ts`:
  - En `crearContactoSchema` y `actualizarContactoSchema`:
    ```typescript
    cuit: z.string().trim().nullable().optional()
      .refine(val => !val || /^\d{11}$/.test(val), { message: 'El CUIT debe tener exactamente 11 dígitos, sin puntos ni guiones' })
      .refine(val => !val || isValidCUIT(val), { message: 'El CUIT ingresado no es matemáticamente válido' })
    ```
- En `src/services/contactoService.ts`:
  - Si `data.cuit === null` o `data.cuit === ''`, normalizar a `null` al actualizar.
  - Al llamar a `upsertEmpresa(finalEmpresaNombre, finalCuit, finalRubroId)`, si `finalCuit === null`, no generar conflicto con empresas que ya tienen CUIT o permitir que el contacto no tenga CUIT asociado.

---

## 2. Botón "Volver Arriba" (Scroll to Top)

### Componente de Cola de Envíos (`DetalleCampana.tsx`)
- Detectar el scroll de la ventana o contenedor (`scrollY > 300` px).
- Renderizar un botón flotante accesible (esquina inferior derecha) con ícono `ArrowUp` de Lucide.
- Estilo: Botón circular con `bg-primary`, sombra flotante `shadow-lg`, transición suave, hover effect, y tooltip `"Volver arriba"`.
- Al hacer clic: `window.scrollTo({ top: 0, behavior: 'smooth' })`.

---

## 3. Criterios de Aceptación
- Un usuario puede editar un contacto existente que tenía CUIT y vaciarlo o tocar "Dejar sin CUIT", guardándolo exitosamente sin errores de validación.
- Un usuario puede crear un nuevo contacto sin ingresar CUIT.
- En la vista de Detalle de Campaña / Cola de Envíos, al bajar en la tabla, aparece el botón flotante y al tocarlo scrollea fluidamente arriba donde están las tarjetas de estadísticas.

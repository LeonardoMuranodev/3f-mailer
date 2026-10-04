# Directiva: Corrección de CUIT y Autocompletado

## Objetivo
- Corregir los datos de prueba (`seed.ts`) para que los CUITs no incluyan guiones.
- Agregar funcionalidad de autocompletado en el frontend cuando el usuario ingrese un CUIT directamente, replicando el comportamiento que ya tiene el campo "Empresa".

## Entradas
- Interfaz "Crear Contacto" en `client/src/components/DirectorioContactos.tsx`.
- Script de inicialización de base de datos `src/scripts/seed.ts`.

## Salidas
- Script `seed.ts` actualizado.
- `DirectorioContactos.tsx` actualizado con el evento `onChange` que filtre no-números, llame al endpoint de sugerencias, y muestre el dropdown.

## Lógica y Pasos
1. Modificar `seed.ts`: Buscar en el arreglo `contactosSeed` todas las instancias de CUIT con guiones (ej. `30-71234567-8`) y reemplazarlas por solo números (`30712345678`).
2. Modificar `DirectorioContactos.tsx`:
   - Envolver el input de CUIT en un div `relative`.
   - Replicar la lógica de mostrar `empresasSugeridas` (dropdown) bajo el input de CUIT.
   - En el `onChange` del CUIT, además de guardar el valor en `form.cuit` sin letras ni guiones, llamar a `buscarEmpresasSugeridas(val)`.
   - En el `onMouseDown` de la lista, autocompletar tanto `empresa_nombre` como `cuit`.

## Trampas Conocidas / Casos Borde
- **Nota:** No ingresar ni guardar CUITs con guiones en la base de datos, porque falla la validación del sistema que espera únicamente 11 dígitos. En su lugar, asegurar que en el frontend y en el seed los guiones se eliminen antes de enviar/insertar la información.

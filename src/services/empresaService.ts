import { dbPool } from '../config/db.js';

export interface Empresa {
  id: string;
  nombre: string;
  cuit: string | null;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Busca o crea una empresa basándose en CUIT o nombre.
 * Retorna el ID de la empresa encontrada o recién creada.
 */
export async function upsertEmpresa(nombre: string | null | undefined, cuit: string | null | undefined): Promise<string | null> {
  if (!nombre && !cuit) return null;

  const nombreLimpio = nombre?.trim() || null;
  const cuitLimpio = cuit?.trim() || null;

  // 1. Buscar por CUIT primero (más confiable)
  if (cuitLimpio) {
    const existing = await dbPool.query<Empresa>(
      `SELECT id, nombre FROM empresas WHERE cuit = $1 LIMIT 1`,
      [cuitLimpio]
    );
    if (existing.rows.length > 0) {
      const empresaEncontrada = existing.rows[0];
      // Si el CUIT ya existe y el nombre ingresado difiere, no lo actualizamos silenciosamente.
      // Arrojamos un error para advertir al usuario.
      if (nombreLimpio && empresaEncontrada.nombre.toLowerCase().trim() !== nombreLimpio.toLowerCase().trim()) {
        throw new Error(`El CUIT ${cuitLimpio} ya está asignado a la empresa "${empresaEncontrada.nombre}". Modifica el CUIT o usa el mismo nombre.`);
      }
      return empresaEncontrada.id;
    }
  }

  // 2. Buscar por nombre exacto (case-insensitive) si no hay CUIT
  if (nombreLimpio && !cuitLimpio) {
    const existing = await dbPool.query<Empresa>(
      `SELECT id FROM empresas WHERE LOWER(nombre) = LOWER($1) AND cuit IS NULL LIMIT 1`,
      [nombreLimpio]
    );
    if (existing.rows.length > 0) return existing.rows[0].id;
  }

  // 3. Crear nueva empresa
  const result = await dbPool.query<Empresa>(
    `INSERT INTO empresas (nombre, cuit) VALUES ($1, $2) RETURNING id`,
    [nombreLimpio ?? 'Sin nombre', cuitLimpio]
  );
  return result.rows[0].id;
}

/**
 * Lista empresas con búsqueda opcional (para autocompletado en frontend).
 */
export async function buscarEmpresas(q?: string): Promise<Empresa[]> {
  if (q) {
    const result = await dbPool.query<Empresa>(
      `SELECT id, nombre, cuit FROM empresas
       WHERE nombre ILIKE $1 OR cuit ILIKE $1
       ORDER BY nombre ASC LIMIT 20`,
      [`%${q}%`]
    );
    return result.rows;
  }
  const result = await dbPool.query<Empresa>(
    `SELECT id, nombre, cuit FROM empresas ORDER BY nombre ASC LIMIT 50`
  );
  return result.rows;
}

/**
 * Actualiza nombre/cuit de una empresa.
 */
export async function actualizarEmpresa(id: string, nombre: string, cuit?: string | null): Promise<Empresa | null> {
  const result = await dbPool.query<Empresa>(
    `UPDATE empresas SET nombre = $1, cuit = $2, actualizado_en = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
    [nombre, cuit ?? null, id]
  );
  return result.rows[0] ?? null;
}

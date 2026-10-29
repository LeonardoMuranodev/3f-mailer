import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dbPool } from '../config/db.js';
import { importarContactosJson } from '../services/contactoService.js';

describe('Google Sheets & Contactos Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('No debe sobreescribir un estado de rebote o inactivo existente con "funcional"', async () => {
    const querySpy = vi.spyOn(dbPool, 'query').mockImplementation(async (sql: any, params?: any) => {
      if (typeof sql === 'string' && sql.includes('SELECT id, nombre FROM rubros')) {
        return { rows: [] } as any;
      }
      if (typeof sql === 'string' && sql.includes('SELECT id, nombre, cuit FROM empresas')) {
        return { rows: [{ id: 'emp-123', nombre: 'Test S.A.', cuit: '20123456789' }] } as any;
      }
      if (typeof sql === 'string' && sql.includes('INSERT INTO contactos')) {
        // Verificar que la consulta SQL contenga la cláusula CASE defensiva
        expect(sql).toContain("contactos.estado LIKE 'rebotado%' OR contactos.estado IN ('inactivo', 'mal_escrito')");
        expect(sql).toContain("EXCLUDED.estado = 'funcional'");
        return { rowCount: 1, rows: [{ id: 'cont-1' }] } as any;
      }
      return { rows: [] } as any;
    });

    const resultado = await importarContactosJson([
      {
        email: 'rebotado_previo@empresa.com',
        empresa_nombre: 'Test S.A.',
        cuit: '20123456789',
        rubro_id: null,
        tipo: 'empresa',
        estado: 'funcional', // Viene como funcional desde un sheet o archivo desactualizado
      },
    ]);

    expect(resultado.procesados).toBe(1);
    expect(resultado.insertados_o_actualizados).toBe(1);
    querySpy.mockRestore();
  });
});

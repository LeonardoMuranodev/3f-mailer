import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Configuración de la BD PRODUCCIÓN (NUEVA) (Lee desde el .env que ya tenés)
const prodPool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '6543'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

// Configuración de la BD VIEJA (Tenés que configurar OLD_DB_URL en tu .env o pasarlo por consola)
// Formato: postgresql://postgres.mhzdgavtkwafhvbntrsy:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
const oldPool = new pg.Pool({
  connectionString: process.env.OLD_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  if (!process.env.OLD_DB_URL) {
    console.error("❌ FALTA OLD_DB_URL en el .env (Ej: postgresql://...)");
    process.exit(1);
  }

  const prodClient = await prodPool.connect();
  const oldClient = await oldPool.connect();

  try {
    console.log("🚀 Iniciando migración de datos...");
    await prodClient.query('BEGIN');

    // 1. Limpiar BD PROD (excepto usuarios)
    console.log("🧹 Vaciando tablas en PROD...");
    await prodClient.query(`
      TRUNCATE TABLE tracking_logs, envios, campanas, contactos, empresas, rubros, smtp_logs, smtp_config RESTART IDENTITY CASCADE;
    `);
    console.log("✅ Tablas limpias.");

    // 2. Migrar Rubros
    console.log("📦 Migrando rubros...");
    const rubrosOld = await oldClient.query('SELECT * FROM rubros');
    for (const r of rubrosOld.rows) {
      await prodClient.query(`
        INSERT INTO rubros (id, nombre, descripcion)
        VALUES ($1, $2, $3)
      `, [r.id, r.nombre, r.descripcion]);
    }
    console.log(`✅ ${rubrosOld.rows.length} rubros migrados.`);

    // 3. Migrar Contactos y crear Empresas dinámicamente
    console.log("📦 Migrando contactos y empresas...");
    const contactosOld = await oldClient.query('SELECT * FROM contactos');
    let empresasCreadas = 0;
    
    for (const c of contactosOld.rows) {
      // Intentar crear la empresa si tiene nombre
      let empresa_id = null;
      if (c.empresa_nombre) {
        // Insertar empresa de forma segura (evitar duplicados por nombre/cuit en memoria)
        const res = await prodClient.query(`
          INSERT INTO empresas (nombre, cuit, creado_en)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (cuit) DO NOTHING
          RETURNING id;
        `, [c.empresa_nombre.trim(), c.cuit]);
        
        if (res.rows.length > 0) {
          empresa_id = res.rows[0].id;
          empresasCreadas++;
        } else {
          // Si hubo conflicto de CUIT y no se insertó, buscarla
          const search = await prodClient.query(`SELECT id FROM empresas WHERE cuit = $1`, [c.cuit]);
          if (search.rows.length > 0) empresa_id = search.rows[0].id;
        }
      }

      await prodClient.query(`
        INSERT INTO contactos (id, email, empresa_nombre, cuit, rubro_id, tipo, estado, empresa_id, creado_en)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        c.id, c.email, c.empresa_nombre, c.cuit, c.rubro_id, c.tipo, c.estado, empresa_id, c.creado_en || new Date()
      ]);
    }
    console.log(`✅ ${empresasCreadas} empresas creadas y ${contactosOld.rows.length} contactos migrados.`);

    // 4. Migrar Campañas (Eventos Historico -> Campañas)
    console.log("📦 Migrando campañas (eventos_historico)...");
    const eventosOld = await oldClient.query('SELECT * FROM eventos_historico');
    for (const ev of eventosOld.rows) {
      await prodClient.query(`
        INSERT INTO campanas (id, asunto, cuerpo, estado, fecha_programada, fecha_finalizacion, stats_total, stats_enviados, stats_errores, creado_en)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        ev.id, 
        ev.asunto_evento, 
        '', // cuerpo vacío porque en la vieja no se guardaba el html
        'Finalizada', 
        ev.creado_en, 
        ev.fecha_finalizacion || ev.creado_en, 
        ev.total_procesados || 0,
        ev.total_enviados || 0, 
        ev.total_errores || 0,
        ev.creado_en
      ]);
    }
    console.log(`✅ ${eventosOld.rows.length} campañas migradas.`);

    // 5. Migrar Envios (Envios Detalle -> envios)
    console.log("📦 Migrando envíos (envios_detalle)...");
    const enviosOld = await oldClient.query('SELECT * FROM envios_detalle');
    for (const envio of enviosOld.rows) {
      await prodClient.query(`
        INSERT INTO envios (id, campana_id, destinatario, estado, error_mensaje, fecha_envio)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        envio.id,
        envio.evento_id,
        envio.correo_destinatario,
        envio.estado,
        envio.error_mensaje,
        envio.fecha_envio || new Date()
      ]);
    }
    console.log(`✅ ${enviosOld.rows.length} envíos migrados.`);

    await prodClient.query('COMMIT');
    console.log("🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE!");

  } catch (err) {
    await prodClient.query('ROLLBACK');
    console.error("❌ ERROR FATAL DURANTE LA MIGRACIÓN. Haciendo ROLLBACK...", err);
  } finally {
    prodClient.release();
    oldClient.release();
    process.exit(0);
  }
}

migrate();

import pg from 'pg';
import dotenv from 'dotenv';
import format from 'pg-format';
dotenv.config();

const prodPool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '6543'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

const oldPool = new pg.Pool({
  connectionString: process.env.OLD_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  if (!process.env.OLD_DB_URL) {
    console.error("❌ FALTA OLD_DB_URL en el .env");
    process.exit(1);
  }

  const prodClient = await prodPool.connect();
  const oldClient = await oldPool.connect();

  try {
    console.log("🚀 Iniciando migración de datos...");
    await prodClient.query('BEGIN');

    console.log("🧹 Vaciando tablas en PROD...");
    await prodClient.query(`
      TRUNCATE TABLE cola_envios, campanas, contactos, empresas, rubros RESTART IDENTITY CASCADE;
    `);
    console.log("✅ Tablas limpias.");

    // 2. Migrar Rubros
    console.log("📦 Migrando rubros...");
    const rubrosOld = await oldClient.query('SELECT * FROM rubros');
    if (rubrosOld.rows.length > 0) {
      const rubrosData = rubrosOld.rows.map(r => [r.id, r.nombre]);
      await prodClient.query(format('INSERT INTO rubros (id, nombre) VALUES %L', rubrosData));
    }
    console.log(`✅ ${rubrosOld.rows.length} rubros migrados.`);

    // 3. Migrar Contactos y crear Empresas
    console.log("📦 Migrando contactos y empresas...");
    const contactosOld = await oldClient.query('SELECT * FROM contactos');
    
    const emailToContactoId = new Map();
    const cuitToEmpresaId = new Map();
    let empresasCreadas = 0;

    for (const c of contactosOld.rows) {
      emailToContactoId.set(c.email, c.id);
      
      let empresa_id = null;
      if (c.empresa_nombre && c.cuit) {
        if (cuitToEmpresaId.has(c.cuit)) {
          empresa_id = cuitToEmpresaId.get(c.cuit);
        } else {
          // Insertar empresa de forma segura
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
            const search = await prodClient.query(`SELECT id FROM empresas WHERE cuit = $1`, [c.cuit]);
            if (search.rows.length > 0) empresa_id = search.rows[0].id;
          }
          cuitToEmpresaId.set(c.cuit, empresa_id);
        }
      }

      const estadoNormalizado = c.estado ? c.estado.replace(/_/g, ' ') : 'funcional';
      
      // Batch contact inserts wouldn't be easy if we loop to find empresas, but we can batch after finding.
      // Let's store for batch insertion:
      c.mapped_empresa_id = empresa_id;
      c.estadoNormalizado = estadoNormalizado;
    }

    if (contactosOld.rows.length > 0) {
      const contactosData = contactosOld.rows.map(c => [
        c.id, c.email, c.empresa_nombre, c.cuit, c.rubro_id, c.tipo, c.estadoNormalizado, c.mapped_empresa_id, c.creado_en || new Date()
      ]);
      // Batch insert in chunks of 1000
      for (let i = 0; i < contactosData.length; i += 1000) {
        const chunk = contactosData.slice(i, i + 1000);
        await prodClient.query(format(
          'INSERT INTO contactos (id, email, empresa_nombre, cuit, rubro_id, tipo, estado, empresa_id, creado_en) VALUES %L', 
          chunk
        ));
      }
    }
    console.log(`✅ ${empresasCreadas} empresas creadas y ${contactosOld.rows.length} contactos migrados.`);

    // 4. Migrar Campañas
    console.log("📦 Migrando campañas...");
    const eventosOld = await oldClient.query('SELECT * FROM eventos_historico');
    if (eventosOld.rows.length > 0) {
      const campanasData = eventosOld.rows.map(ev => [
        ev.id, 
        ev.asunto_evento, 
        '', // cuerpo_html vacío
        'completada', // estado
        true, // para_todos_rubros
        ev.creado_en || new Date()
      ]);
      await prodClient.query(format(
        'INSERT INTO campanas (id, asunto, cuerpo_html, estado, para_todos_rubros, creado_en) VALUES %L',
        campanasData
      ));
    }
    console.log(`✅ ${eventosOld.rows.length} campañas migradas.`);

    // 5. Migrar Envios a cola_envios
    console.log("📦 Migrando envíos a cola_envios...");
    const enviosOld = await oldClient.query('SELECT * FROM envios_detalle');
    
    const enviosData = [];
    for (const envio of enviosOld.rows) {
      const contacto_id = emailToContactoId.get(envio.correo_destinatario);
      if (!contacto_id) continue;
      
      enviosData.push([
        envio.evento_id,
        contacto_id,
        envio.estado || 'pendiente', // aseguramos un estado
        envio.error_mensaje,
        envio.fecha_envio || new Date(),
        0 // intentos
      ]);
    }

    if (enviosData.length > 0) {
      // Chunk insert envios
      for (let i = 0; i < enviosData.length; i += 1000) {
        const chunk = enviosData.slice(i, i + 1000);
        await prodClient.query(format(
          'INSERT INTO cola_envios (campana_id, contacto_id, estado, respuesta_smtp, fecha_envio, intentos) VALUES %L',
          chunk
        ));
      }
    }
    console.log(`✅ ${enviosData.length} envíos migrados a cola_envios.`);

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

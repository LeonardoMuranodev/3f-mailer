import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { dbPool } from './dist/config/db.js';

function parseFechaLimite(str) {
  if (!str) return null;
  const s = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parts = s.split('/');
  if (parts.length === 3) {
    const dia = parts[0].padStart(2, '0');
    const mes = parts[1].padStart(2, '0');
    const anio = parts[2];
    return `${anio}-${mes}-${dia}`;
  }
  return null;
}

function parseMarcaTemporal(str) {
  if (!str) return new Date();
  const match = str.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/);
  if (match) {
    const dia = match[1].padStart(2, '0');
    const mes = match[2].padStart(2, '0');
    const anio = match[3];
    const h = (match[4] || '12').padStart(2, '0');
    const m = (match[5] || '00').padStart(2, '0');
    const s = (match[6] || '00').padStart(2, '0');
    return new Date(`${anio}-${mes}-${dia}T${h}:${m}:${s}-03:00`);
  }
  return new Date();
}

function normalizarRubros(rubrosStr) {
  if (!rubrosStr) return [];
  return rubrosStr
    .split(',')
    .map(r => r.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    .filter(Boolean);
}

async function migrarCampanasHistoricas() {
  const client = await dbPool.connect();

  try {
    console.log('🚀 Iniciando migración de campañas históricas y colas de envío...');
    await client.query('BEGIN');

    // 0. Asegurar contactos faltantes (ej: info@astillerosviking.com)
    console.log('📦 Asegurando contactos base...');
    await client.query(`
      INSERT INTO contactos (email, empresa_nombre, estado, tipo) 
      VALUES ('info@astillerosviking.com', 'Astilleros Viking', 'funcional', 'empresa') 
      ON CONFLICT (email) DO NOTHING
    `);

    // Mapas de lookup
    const contactosRes = await client.query('SELECT id, email FROM contactos');
    const emailToContactoId = new Map();
    for (const c of contactosRes.rows) {
      emailToContactoId.set(c.email.trim().toLowerCase(), c.id);
    }

    const smtpRes = await client.query('SELECT id, email FROM cuentas_smtp');
    const smtpEmailToId = new Map();
    for (const s of smtpRes.rows) {
      smtpEmailToId.set(s.email.trim().toLowerCase(), s.id);
    }

    // Leer CSVs
    const eventosCsvPath = fs.existsSync('/app/info-campanas-actuales/envios_mails_empresas - eventos_config_prod.csv')
      ? '/app/info-campanas-actuales/envios_mails_empresas - eventos_config_prod.csv'
      : 'docs/info-campanas-actuales/envios_mails_empresas - eventos_config_prod.csv';

    const colaCsvPath = fs.existsSync('/app/info-campanas-actuales/envios_mails_empresas - cola_envios.csv')
      ? '/app/info-campanas-actuales/envios_mails_empresas - cola_envios.csv'
      : 'docs/info-campanas-actuales/envios_mails_empresas - cola_envios.csv';

    const eventosRaw = parse(fs.readFileSync(eventosCsvPath, 'utf8'), { columns: true, skip_empty_lines: true, trim: true });
    const colaRaw = parse(fs.readFileSync(colaCsvPath, 'utf8'), { columns: true, skip_empty_lines: true, trim: true });

    console.log(`📋 Total eventos en CSV: ${eventosRaw.length}`);
    console.log(`📋 Total registros en cola CSV: ${colaRaw.length}`);

    // Organizar cola por id_evento
    const enviosPorEvento = new Map();
    for (const row of colaRaw) {
      const evKey = row.id_evento ? row.id_evento.trim() : '';
      if (!enviosPorEvento.has(evKey)) {
        enviosPorEvento.set(evKey, []);
      }
      enviosPorEvento.get(evKey).push(row);
    }

    // PASO 1: "Taller para Pymes"
    console.log('\n--- PASO 1: Actualizando Taller para Pymes ---');
    const tallerRes = await client.query(`
      UPDATE campanas 
      SET fecha_limite_envio = '2026-08-10', actualizado_en = CURRENT_TIMESTAMP
      WHERE LOWER(TRIM(asunto)) = 'taller para pymes'
      RETURNING id, asunto, fecha_limite_envio
    `);
    if (tallerRes.rows.length > 0) {
      console.log(`✅ Taller para Pymes actualizado: fecha_limite_envio = ${tallerRes.rows[0].fecha_limite_envio}`);
    } else {
      console.warn('⚠️ No se encontró la campaña Taller para Pymes en DB');
    }

    // PASO 2: "Conectá con China – Parte II"
    console.log('\n--- PASO 2: Actualizando Conectá con China – Parte II ---');
    const chinaEvento = eventosRaw.find(e => e['Marca temporal'] === '17/09/2026 13:00:12');
    let chinaCampanaId = null;

    const chinaDbRes = await client.query(`
      SELECT id FROM campanas WHERE LOWER(TRIM(asunto)) LIKE '%china%' LIMIT 1
    `);

    if (chinaDbRes.rows.length > 0) {
      chinaCampanaId = chinaDbRes.rows[0].id;
      await client.query(`
        UPDATE campanas
        SET fecha_limite_envio = $1,
            flyer_url = $2,
            link_inscripcion = $3,
            cuerpo_html = $4,
            prioridad = $5,
            para_todos_rubros = $6,
            rubros_seleccionados = $7,
            actualizado_en = CURRENT_TIMESTAMP
        WHERE id = $8
      `, [
        parseFechaLimite(chinaEvento['Fecha limite para finalizar el envio']),
        chinaEvento['Subir Flyer (archivo)'] || null,
        chinaEvento['Link de inscripcion del evento'] || null,
        chinaEvento['Cuerpo del correo'] || '',
        chinaEvento['Prioridad de la campaña']?.toLowerCase() || 'normal',
        true,
        JSON.stringify([]),
        chinaCampanaId
      ]);
      console.log(`✅ Conectá con China metadatos actualizados (ID: ${chinaCampanaId}, límite: ${parseFechaLimite(chinaEvento['Fecha limite para finalizar el envio'])})`);
    } else {
      const insRes = await client.query(`
        INSERT INTO campanas (asunto, cuerpo_html, link_inscripcion, flyer_url, fecha_limite_envio, prioridad, para_todos_rubros, rubros_seleccionados, estado, creado_en)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completada', $9)
        RETURNING id
      `, [
        chinaEvento['Asunto del correo'].trim(),
        chinaEvento['Cuerpo del correo'] || '',
        chinaEvento['Link de inscripcion del evento'] || null,
        chinaEvento['Subir Flyer (archivo)'] || null,
        parseFechaLimite(chinaEvento['Fecha limite para finalizar el envio']),
        chinaEvento['Prioridad de la campaña']?.toLowerCase() || 'normal',
        true,
        JSON.stringify([]),
        parseMarcaTemporal(chinaEvento['Marca temporal'])
      ]);
      chinaCampanaId = insRes.rows[0].id;
      console.log(`✅ Conectá con China creada (ID: ${chinaCampanaId})`);
    }

    // Cargar cola de envíos para Conectá con China
    await insertarColaDeEnvios(client, chinaCampanaId, enviosPorEvento.get('17/09/2026 13:00:12') || [], emailToContactoId, smtpEmailToId);

    // PASO 3: Los 4 eventos finalizados adicionales
    console.log('\n--- PASO 3: Migrando los 4 eventos finalizados adicionales ---');

    // Filtramos solo los eventos de eventos_config_prod.csv que están en estado "finalizada"
    // (excluyendo Conectá con China que ya se procesó arriba)
    const eventosFinalizados = eventosRaw.filter(e => 
      e.estado_evento === 'finalizada' && e['Marca temporal'] !== '17/09/2026 13:00:12'
    );

    console.log(`Eventos finalizados a procesar: ${eventosFinalizados.length}`);

    for (const ev of eventosFinalizados) {
      const marca = ev['Marca temporal'].trim();
      const asunto = ev['Asunto del correo'].trim();
      const fechaLimite = parseFechaLimite(ev['Fecha limite para finalizar el envio']);
      const prioridad = ev['Prioridad de la campaña']?.toLowerCase() || 'normal';
      const paraTodos = ev['Deseas que esta campaña sea para todos los rubros?']?.trim().toLowerCase().startsWith('si') ? true : false;
      const rubros = paraTodos ? [] : normalizarRubros(ev['Rubros']);
      const linkInscripcion = ev['Link de inscripcion del evento'] || null;
      const flyerUrl = ev['Subir Flyer (archivo)'] || null;
      const cuerpo = ev['Cuerpo del correo'] || '';
      const creadoEn = parseMarcaTemporal(marca);

      console.log(`\n📌 Procesando evento: "${asunto}" (Marca: ${marca})`);

      // Buscar si ya existe la campaña por asunto y fecha cercana (para idempotencia)
      let campanaId = null;
      if (marca === '28/09/2026 9:49:16') {
        const existRes = await client.query(`
          SELECT id FROM campanas WHERE LOWER(TRIM(asunto)) LIKE '%rigi%' AND creado_en < '2026-09-30T00:00:00Z' LIMIT 1
        `);
        if (existRes.rows.length > 0) campanaId = existRes.rows[0].id;
      }

      if (!campanaId) {
        const existByAsunto = await client.query(`
          SELECT id FROM campanas WHERE LOWER(TRIM(asunto)) = LOWER(TRIM($1)) AND DATE(creado_en) = DATE($2) LIMIT 1
        `, [asunto, creadoEn]);
        if (existByAsunto.rows.length > 0) campanaId = existByAsunto.rows[0].id;
      }

      if (campanaId) {
        await client.query(`
          UPDATE campanas
          SET asunto = $1,
              fecha_limite_envio = $2,
              prioridad = $3,
              para_todos_rubros = $4,
              rubros_seleccionados = $5,
              link_inscripcion = $6,
              flyer_url = $7,
              cuerpo_html = $8,
              actualizado_en = CURRENT_TIMESTAMP
          WHERE id = $9
        `, [
          asunto,
          fechaLimite,
          prioridad,
          paraTodos,
          JSON.stringify(rubros),
          linkInscripcion,
          flyerUrl,
          cuerpo,
          campanaId
        ]);
        console.log(`  🔄 Campaña actualizada existente en DB: ID ${campanaId}, límite: ${fechaLimite}`);
      } else {
        const insCampana = await client.query(`
          INSERT INTO campanas (asunto, cuerpo_html, link_inscripcion, flyer_url, fecha_limite_envio, prioridad, para_todos_rubros, rubros_seleccionados, estado, creado_en)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completada', $9)
          RETURNING id
        `, [
          asunto,
          cuerpo,
          linkInscripcion,
          flyerUrl,
          fechaLimite,
          prioridad,
          paraTodos,
          JSON.stringify(rubros),
          creadoEn
        ]);
        campanaId = insCampana.rows[0].id;
        console.log(`  ✨ Campaña creada en DB: ID ${campanaId}, límite: ${fechaLimite}`);
      }

      // Obtener filas de envíos correspondientes a esta marca temporal
      // (Nota: para solidworks 6/10/2026, incluimos match con '06/10/2026 10:02:07' si existiera)
      let enviosRows = enviosPorEvento.get(marca) || [];
      if (marca === '6/10/2026 10:02:07' && enviosPorEvento.has('06/10/2026 10:02:07')) {
        enviosRows = enviosRows.concat(enviosPorEvento.get('06/10/2026 10:02:07'));
      }

      console.log(`  📬 Envíos en CSV para este evento: ${enviosRows.length}`);
      await insertarColaDeEnvios(client, campanaId, enviosRows, emailToContactoId, smtpEmailToId);
    }

    await client.query('COMMIT');
    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE CON TODAS LAS CAMPAÑAS Y ENVÍOS!');

    // Reporte final de validación
    const finalCampanas = await client.query('SELECT id, asunto, fecha_limite_envio, prioridad, para_todos_rubros, estado FROM campanas ORDER BY creado_en ASC');
    console.log('\n--- ESTADO FINAL DE CAMPAÑAS EN DB ---');
    console.table(finalCampanas.rows);

    const finalCola = await client.query(`
      SELECT c.asunto, q.estado, COUNT(q.id) as cantidad
      FROM cola_envios q
      JOIN campanas c ON q.campana_id = c.id
      GROUP BY c.asunto, q.estado
      ORDER BY c.asunto, q.estado
    `);
    console.log('\n--- RESUMEN DE COLA DE ENVÍOS POR CAMPAÑA ---');
    console.table(finalCola.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ ERROR FATAL EN MIGRACIÓN:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

async function insertarColaDeEnvios(client, campanaId, enviosRows, emailToContactoId, smtpEmailToId) {
  if (!enviosRows || enviosRows.length === 0) {
    console.log('    ℹ️ No hay filas de envíos para insertar.');
    return;
  }

  // Consultar contactos que ya tienen envío registrado para esta campaña (para idempotencia)
  const yaRegistrados = await client.query(
    'SELECT contacto_id FROM cola_envios WHERE campana_id = $1',
    [campanaId]
  );
  const contactosExistentes = new Set(yaRegistrados.rows.map(r => r.contacto_id));
  console.log(`    ℹ️ Envíos ya registrados previamente en DB: ${contactosExistentes.size}`);

  const aInsertar = [];
  let omitidosSinEmail = 0;

  for (const row of enviosRows) {
    const email = row.mail_destino?.trim().toLowerCase();
    if (!email) continue;

    const contactoId = emailToContactoId.get(email);
    if (!contactoId) {
      omitidosSinEmail++;
      continue;
    }

    if (contactosExistentes.has(contactoId)) {
      continue; // ya insertado
    }

    const estadoFinal = (row.estado?.toLowerCase() === 'enviado') ? 'enviado' : 'fallido';
    const respuestaSmtp = row.mensaje_error ? row.mensaje_error.trim() : (estadoFinal === 'enviado' ? 'OK' : 'Error de envio');
    const cuentaSmtpId = smtpEmailToId.get(row.enviado_por?.trim().toLowerCase()) || null;
    const fechaEnvio = row.fecha_de_envio ? new Date(row.fecha_de_envio) : new Date();

    aInsertar.push({
      campana_id: campanaId,
      contacto_id: contactoId,
      cuenta_smtp_id: cuentaSmtpId,
      estado: estadoFinal,
      respuesta_smtp: respuestaSmtp,
      intentos: 1,
      fecha_programada: fechaEnvio,
      fecha_envio: fechaEnvio,
      creado_en: fechaEnvio
    });
  }

  console.log(`    ➕ Nuevos envíos a insertar en lote: ${aInsertar.length} (omitidos sin contacto: ${omitidosSinEmail})`);

  // Insertar en lotes de 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < aInsertar.length; i += BATCH_SIZE) {
    const chunk = aInsertar.slice(i, i + BATCH_SIZE);
    
    const valueClauses = [];
    const values = [];
    let pIdx = 1;

    for (const item of chunk) {
      valueClauses.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6}, $${pIdx+7}, $${pIdx+8})`);
      values.push(
        item.campana_id,
        item.contacto_id,
        item.cuenta_smtp_id,
        item.estado,
        item.respuesta_smtp,
        item.intentos,
        item.fecha_programada,
        item.fecha_envio,
        item.creado_en
      );
      pIdx += 9;
    }

    const insertSql = `
      INSERT INTO cola_envios (
        campana_id, contacto_id, cuenta_smtp_id, estado, respuesta_smtp, intentos, fecha_programada, fecha_envio, creado_en
      ) VALUES ${valueClauses.join(', ')}
    `;

    await client.query(insertSql, values);
  }

  console.log(`    ✅ Insertados ${aInsertar.length} envíos.`);
}

migrarCampanasHistoricas().catch(console.error);

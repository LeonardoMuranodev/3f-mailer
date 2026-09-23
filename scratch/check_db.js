const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  host: 'localhost',
  port: 6543,
  database: 'postgres',
  user: 'postgres.exeqrygexlswsspsfshs',
  password: process.env.DB_PASSWORD || 'O5a14JjB44W20lUe'
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT c.id, c.asunto, c.estado, 
             (SELECT count(*) FROM cola_envios ce WHERE ce.campana_id = c.id) as total, 
             (SELECT count(*) FROM cola_envios ce WHERE ce.campana_id = c.id AND ce.estado = 'pendiente') as pendientes 
      FROM campanas c
    `);
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();

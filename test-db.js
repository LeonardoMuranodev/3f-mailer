const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_TEST_HOST,
  port: process.env.DB_TEST_PORT,
  user: process.env.DB_TEST_USER,
  password: process.env.DB_TEST_PASSWORD,
  database: process.env.DB_TEST_NAME,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT e.id, e.nombre, e.cuit, (SELECT c.rubro_id FROM contactos c WHERE c.empresa_id = e.id AND c.rubro_id IS NOT NULL LIMIT 1) as rubro_id FROM empresas e LIMIT 5").then(res => {
  console.log('Empresas test:', res.rows);
  process.exit(0);
}).catch(err => {
  console.error(err.message);
  process.exit(1);
});

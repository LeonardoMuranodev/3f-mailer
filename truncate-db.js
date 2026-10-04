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

pool.query("TRUNCATE TABLE cola_envios, campanas, contactos, empresas CASCADE;").then(res => {
  console.log('Tablas limpiadas.');
  process.exit(0);
}).catch(err => {
  console.error(err.message);
  process.exit(1);
});

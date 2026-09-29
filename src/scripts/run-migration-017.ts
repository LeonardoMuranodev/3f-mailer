import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '6543'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  const filePath = path.join(__dirname, '../migrations/017_add_adjunto_nombre_original.sql');
  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    await client.connect();
    console.log('Ejecutando migración 017...');
    await client.query(sql);
    console.log('Migración 017 ejecutada correctamente.');
  } catch (err) {
    console.error('Error al ejecutar la migración 017:', err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

runMigration();

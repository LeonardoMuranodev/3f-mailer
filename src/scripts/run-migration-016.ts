import { dbPool } from '../config/db.js';
import fs from 'fs';
import path from 'path';

async function run() {
  try {
    const sql = fs.readFileSync(path.resolve(__dirname, '../migrations/016_campanas_borrador_opcionales.sql'), 'utf-8');
    await dbPool.query(sql);
    console.log('Migración 016 ejecutada');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();

import { db } from './db/index';
import { sql } from 'drizzle-orm';

async function resetDb() {
  try {
    console.log('Dropping all tables...');
    await db.execute(sql`DROP SCHEMA public CASCADE;`);
    await db.execute(sql`CREATE SCHEMA public;`);
    console.log('Database wiped.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetDb();

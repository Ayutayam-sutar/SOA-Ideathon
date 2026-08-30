import { db } from './index';
import { sql } from 'drizzle-orm';

async function fixDb() {
  try {
    console.log('Dropping users table...');
    await db.execute(sql`DROP TABLE IF EXISTS "users" CASCADE;`);
    console.log('Dropped.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixDb();

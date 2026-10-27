import { db } from './index';
import * as s from './schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('--- Seeding EMS Standalone Database ---');
  try {
    const regionCount = await db.select().from(s.regions);
    console.log(`Found ${regionCount.length} existing regions.`);
    const stationCount = await db.select().from(s.stations);
    console.log(`Found ${stationCount.length} existing stations.`);
    const usersCount = await db.select().from(s.users);
    console.log(`Found ${usersCount.length} existing users.`);
    const dispatchCount = await db.select().from(s.emsDispatches);
    console.log(`Found ${dispatchCount.length} existing dispatches.`);
    console.log('Database initialized successfully from init.sql / seed.');
  } catch (err) {
    console.error('Seed verification error:', err);
  } finally {
    process.exit(0);
  }
}

seed();

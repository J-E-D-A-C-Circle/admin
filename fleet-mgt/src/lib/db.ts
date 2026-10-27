import mysql from 'mysql2/promise';

const databaseUrl =
  process.env.DATABASE_URL || 'mysql://fleet_user:fleet_password@localhost:3309/fleet_db';

const globalForMysql = globalThis as unknown as { fleetPool?: mysql.Pool };

export const pool = globalForMysql.fleetPool ?? mysql.createPool(databaseUrl);

if (process.env.NODE_ENV !== 'production') globalForMysql.fleetPool = pool;

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL || 'mysql://dams_user:dams_password@localhost:3306/dams_db';

const globalForMysql = globalThis as unknown as {
  conn: mysql.Pool | undefined;
};

const conn = globalForMysql.conn ?? mysql.createPool(databaseUrl);

if (process.env.NODE_ENV !== 'production') globalForMysql.conn = conn;

export const db = drizzle(conn, { schema, mode: 'default' });
export const poolConnection = conn;
export type DbClient = typeof db;
export * as schema from './schema';

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'mysql://ems_user:ems_password@localhost:3308/ems_db';

const poolConnection = mysql.createPool(connectionString);

export const db = drizzle(poolConnection, { schema, mode: 'default' });

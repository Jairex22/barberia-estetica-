import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';
import { config } from '../config.js';

export function createDb(url: string = config.DATABASE_URL) {
  const sql = postgres(url, { max: config.NODE_ENV === 'test' ? 5 : 20, idle_timeout: 30, connect_timeout: 10 });
  const db = drizzle(sql, { schema, casing: 'snake_case' });
  return { sql, db };
}
export type Db = ReturnType<typeof createDb>['db'];
export type Sql = ReturnType<typeof createDb>['sql'];
export { schema };

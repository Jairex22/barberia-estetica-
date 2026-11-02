import { eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { settings } from '../db/schema.js';

const DEFAULTS: Record<string, unknown> = {
  premium_price_mxn_minor: 19900,
  premium_price_usd_minor: 999,
  discovery_enabled: true,
  registration_open: true,
  launch_cities: ['Guadalajara'],
};
const cache = new Map<string, { value: unknown; at: number }>();

export async function getSetting<T>(db: Db, key: string): Promise<T> {
  const c = cache.get(key);
  if (c && Date.now() - c.at < 15_000) return c.value as T;
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  const value = row ? row.value : DEFAULTS[key];
  cache.set(key, { value, at: Date.now() });
  return value as T;
}
export async function setSetting(db: Db, key: string, value: unknown) {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date().toISOString() } });
  cache.delete(key);
}
export const SETTING_DEFAULTS = DEFAULTS;

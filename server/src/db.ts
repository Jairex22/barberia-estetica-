import Database from "better-sqlite3";
import { env } from "./env.js";

export const db = new Database(env.databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function tableExists(name: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name);
  return !!row;
}

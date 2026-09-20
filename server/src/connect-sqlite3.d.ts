declare module "connect-sqlite3" {
  import type session from "express-session";
  export default function connectSqlite3(
    s: typeof session
  ): new (options: { db: string; dir?: string }) => session.Store;
}

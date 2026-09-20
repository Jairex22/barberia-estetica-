import { db } from "../db.js";
import type { SiteContent } from "../types.js";
import { rebuildKnowledgeFromContent } from "./knowledge.js";

export function getContent(status: "draft" | "published"): SiteContent | null {
  const row = db
    .prepare("SELECT data FROM site_content WHERE status = ?")
    .get(status) as { data: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.data) as SiteContent;
}

export function saveDraft(content: SiteContent) {
  db.prepare(
    `INSERT INTO site_content (status, data, updated_at) VALUES ('draft', ?, datetime('now'))
     ON CONFLICT(status) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).run(JSON.stringify(content));
}

export function publishDraft(): SiteContent {
  const draft = getContent("draft");
  if (!draft) throw new Error("No hay borrador para publicar");
  db.prepare(
    `INSERT INTO site_content (status, data, updated_at) VALUES ('published', ?, datetime('now'))
     ON CONFLICT(status) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).run(JSON.stringify(draft));
  rebuildKnowledgeFromContent(draft);
  return draft;
}

export function initContentIfMissing(seed: SiteContent) {
  if (!getContent("draft")) saveDraft(seed);
  if (!getContent("published")) publishDraft();
}

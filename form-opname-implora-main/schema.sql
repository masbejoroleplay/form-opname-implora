-- Jalankan query ini di KEDUA database D1:
--   1. DB untuk AEON
--   2. DB untuk Watsons
--
-- Cara: Cloudflare Dashboard → Workers & Pages → D1 → pilih database → Console → paste & Execute

CREATE TABLE IF NOT EXISTS wa_templates (
  key        TEXT PRIMARY KEY,
  text       TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

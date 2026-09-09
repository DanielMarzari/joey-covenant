-- Covenant Senior Benefits — admin content store (Cloudflare D1 / SQLite)
--
-- `tags` is a comma-separated list of page slugs (e.g. 'home,medicare-advantage').
-- An empty string means "show everywhere". This is what lets one dataset feed
-- all ~20 pages without building a separate admin screen per page.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS photos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  r2_key        TEXT    NOT NULL UNIQUE,
  alt_text      TEXT    NOT NULL DEFAULT '',
  caption       TEXT,
  width         INTEGER,
  height        INTEGER,
  content_type  TEXT,
  bytes         INTEGER,
  tags          TEXT    NOT NULL DEFAULT '',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  published     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_photos_live ON photos(published, sort_order);

CREATE TABLE IF NOT EXISTS testimonials (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  quote         TEXT    NOT NULL,
  author_name   TEXT    NOT NULL,
  author_meta   TEXT    NOT NULL DEFAULT '',   -- 'Pennsylvania · Age 78'
  initials      TEXT    NOT NULL DEFAULT '',   -- avatar; derived from name if blank
  stars         INTEGER NOT NULL DEFAULT 5 CHECK (stars BETWEEN 1 AND 5),
  tags          TEXT    NOT NULL DEFAULT '',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  published     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_testimonials_live ON testimonials(published, sort_order);

-- Places Joey has presented.
CREATE TABLE IF NOT EXISTS locations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  venue         TEXT    NOT NULL,
  city          TEXT    NOT NULL DEFAULT '',
  state         TEXT    NOT NULL DEFAULT '',
  event_date    TEXT,                          -- ISO 'YYYY-MM-DD', nullable
  description   TEXT    NOT NULL DEFAULT '',
  photo_id      INTEGER REFERENCES photos(id) ON DELETE SET NULL,
  tags          TEXT    NOT NULL DEFAULT '',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  published     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_locations_live ON locations(published, sort_order);

CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT    PRIMARY KEY,           -- 256-bit random, hex
  created_at    INTEGER NOT NULL,              -- epoch ms
  expires_at    INTEGER NOT NULL,
  last_seen     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

-- Login throttling, keyed by CF-Connecting-IP.
CREATE TABLE IF NOT EXISTS login_attempts (
  ip            TEXT    PRIMARY KEY,
  fails         INTEGER NOT NULL DEFAULT 0,
  locked_until  INTEGER NOT NULL DEFAULT 0     -- epoch ms
);

-- Editable video embeds. `slot` is a stable identifier the front-end pages
-- look up (e.g. 'approaching-medicare', 'already-on-medicare'). One of
-- youtube_id / vimeo_id / direct_url should be set; the front-end prefers
-- them in that order.
CREATE TABLE IF NOT EXISTS videos (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  slot               TEXT    NOT NULL UNIQUE,
  title              TEXT    NOT NULL DEFAULT '',
  youtube_id         TEXT,
  vimeo_id           TEXT,
  direct_url         TEXT,
  poster_url         TEXT,
  duration_seconds   INTEGER,
  aspect_ratio       TEXT    NOT NULL DEFAULT '16/9',  -- '9/16' for vertical
  tags               TEXT    NOT NULL DEFAULT '',
  sort_order         INTEGER NOT NULL DEFAULT 0,
  published          INTEGER NOT NULL DEFAULT 1,
  updated_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_videos_live ON videos(published, sort_order);

-- Seed the two known slots so the admin UI has editable rows on first login.
INSERT OR IGNORE INTO videos (slot, title, aspect_ratio, sort_order) VALUES
  ('approaching-medicare',  'Approaching Medicare',   '9/16', 1),
  ('already-on-medicare',   'Already on Medicare',    '9/16', 2);

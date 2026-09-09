// Data layer. Each entity declares the columns the admin UI may write, so a
// stray field in a request body can never reach the SQL.

export const ENTITIES = {
  testimonials: {
    table: 'testimonials',
    fields: ['quote', 'author_name', 'author_meta', 'initials', 'stars', 'tags', 'sort_order', 'published'],
    required: ['quote', 'author_name'],
  },
  locations: {
    table: 'locations',
    fields: ['venue', 'city', 'state', 'event_date', 'description', 'photo_id', 'tags', 'sort_order', 'published'],
    required: ['venue'],
  },
  photos: {
    table: 'photos',
    fields: ['alt_text', 'caption', 'tags', 'sort_order', 'published'],
    required: [],
  },
  videos: {
    table: 'videos',
    fields: ['slot', 'title', 'youtube_id', 'vimeo_id', 'direct_url', 'poster_url',
             'duration_seconds', 'aspect_ratio', 'tags', 'sort_order', 'published'],
    required: ['slot'],
  },
};

const NULLABLE = new Set([
  'event_date', 'photo_id', 'youtube_id', 'vimeo_id', 'direct_url',
  'poster_url', 'duration_seconds',
]);

// Keeps a stray or hostile key out of the SQL, and normalizes the types D1
// accepts (no booleans, no undefined).
function sanitize(entity, body) {
  const spec = ENTITIES[entity];
  const out = {};
  for (const f of spec.fields) {
    if (!(f in body)) continue;
    let v = body[f];
    if (v === undefined) continue;
    if (typeof v === 'boolean') v = v ? 1 : 0;
    // Clearing an optional field should store NULL, not an empty string —
    // the front-end tests these for presence.
    if (v === '' && NULLABLE.has(f)) v = null;
    out[f] = v;
  }
  return out;
}

export function validate(entity, data, { partial = false } = {}) {
  const spec = ENTITIES[entity];
  const errors = [];
  if (!partial) {
    for (const f of spec.required) {
      if (!data[f] || String(data[f]).trim() === '') errors.push(`${f} is required`);
    }
  }
  if ('stars' in data) {
    const n = Number(data.stars);
    if (!Number.isInteger(n) || n < 1 || n > 5) errors.push('stars must be 1-5');
  }
  if ('tags' in data && typeof data.tags !== 'string') errors.push('tags must be a string');
  if ('event_date' in data && data.event_date != null && data.event_date !== '') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.event_date)) errors.push('event_date must be YYYY-MM-DD');
  }
  return errors;
}

// Normalizes 'Home, Medicare-Advantage ' -> 'home,medicare-advantage'
export function normalizeTags(tags) {
  if (!tags) return '';
  return [...new Set(
    String(tags).split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
  )].join(',');
}

export async function list(db, entity, { publishedOnly = false } = {}) {
  const { table } = ENTITIES[entity];
  const where = publishedOnly ? 'WHERE published = 1' : '';
  const { results } = await db
    .prepare(`SELECT * FROM ${table} ${where} ORDER BY sort_order ASC, id ASC`)
    .all();
  return results ?? [];
}

export async function get(db, entity, id) {
  const { table } = ENTITIES[entity];
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
}

export async function create(db, entity, body) {
  const spec = ENTITIES[entity];
  const data = sanitize(entity, body);
  if ('tags' in data) data.tags = normalizeTags(data.tags);

  const errors = validate(entity, data);
  if (errors.length) return { errors };

  // New rows land at the end of the list.
  if (!('sort_order' in data)) {
    const row = await db.prepare(`SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM ${spec.table}`).first();
    data.sort_order = row.n;
  }

  const cols = Object.keys(data);
  const placeholders = cols.map((_, i) => `?${i + 1}`).join(', ');
  const res = await db
    .prepare(`INSERT INTO ${spec.table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`)
    .bind(...cols.map((c) => data[c]))
    .first();
  return { row: res };
}

export async function update(db, entity, id, body) {
  const spec = ENTITIES[entity];
  const data = sanitize(entity, body);
  if ('tags' in data) data.tags = normalizeTags(data.tags);

  const errors = validate(entity, data, { partial: true });
  if (errors.length) return { errors };
  if (!Object.keys(data).length) return { errors: ['no writable fields supplied'] };

  const cols = Object.keys(data);
  const sets = cols.map((c, i) => `${c} = ?${i + 1}`);
  // photos has no updated_at column.
  if (spec.table !== 'photos') sets.push(`updated_at = datetime('now')`);

  const res = await db
    .prepare(`UPDATE ${spec.table} SET ${sets.join(', ')} WHERE id = ?${cols.length + 1} RETURNING *`)
    .bind(...cols.map((c) => data[c]), id)
    .first();
  return res ? { row: res } : { errors: ['not found'] };
}

export async function remove(db, entity, id) {
  const { table } = ENTITIES[entity];
  const res = await db.prepare(`DELETE FROM ${table} WHERE id = ? RETURNING id`).bind(id).first();
  return Boolean(res);
}

// Drag-to-reorder: one batch so the list can never be left half-renumbered.
export async function reorder(db, entity, ids) {
  const { table } = ENTITIES[entity];
  const stmt = db.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`);
  await db.batch(ids.map((id, i) => stmt.bind(i + 1, id)));
}

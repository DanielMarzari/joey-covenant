// Covenant Senior Benefits — admin API + UI.
//
// Bound to www.covenantseniorbenefits.com/api/* and /admin* as a Cloudflare
// Worker Route. Every other path falls through to GoHighLevel untouched.

import {
  verifyPassword, checkThrottle, recordFailure, clearFailures,
  createSession, getSession, destroySession, sweepExpired,
  sessionCookie, clearCookie,
} from './auth.js';
import { ENTITIES, list, get, create, update, remove, reorder } from './db.js';
import { renderLogin, renderAdmin } from './admin-ui.js';

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...(init.headers || {}),
    },
  });

const html = (body, init = {}) =>
  new Response(body, {
    ...init,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // The admin UI must never be indexed or framed.
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'same-origin',
      ...(init.headers || {}),
    },
  });

const clientIp = (request) =>
  request.headers.get('CF-Connecting-IP') || 'local';

async function etagFor(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return '"' + [...new Uint8Array(digest)].slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0')).join('') + '"';
}

// ---------------------------------------------------------------- public read

async function publicContent(request, env) {
  const [testimonials, locations, photos, videos] = await Promise.all([
    list(env.DB, 'testimonials', { publishedOnly: true }),
    list(env.DB, 'locations', { publishedOnly: true }),
    list(env.DB, 'photos', { publishedOnly: true }),
    list(env.DB, 'videos', { publishedOnly: true }),
  ]);

  const core = {
    videos: videos.map((v) => ({
      slot: v.slot,
      title: v.title,
      youtube_id: v.youtube_id,
      vimeo_id: v.vimeo_id,
      direct_url: v.direct_url,
      poster_url: v.poster_url,
      duration_seconds: v.duration_seconds,
      aspect_ratio: v.aspect_ratio || '16/9',
      tags: v.tags ? v.tags.split(',') : [],
    })),
    testimonials: testimonials.map((t) => ({
      id: t.id,
      quote: t.quote,
      author_name: t.author_name,
      author_meta: t.author_meta,
      initials: t.initials || initialsFrom(t.author_name),
      stars: t.stars,
      tags: t.tags ? t.tags.split(',') : [],
    })),
    locations: locations.map((l) => ({
      id: l.id,
      venue: l.venue,
      city: l.city,
      state: l.state,
      event_date: l.event_date,
      description: l.description,
      photo: l.photo_id ? photoUrl(photos, l.photo_id) : null,
      tags: l.tags ? l.tags.split(',') : [],
    })),
    photos: photos.map((p) => ({
      id: p.id,
      url: `/api/photos/${p.r2_key}`,
      alt: p.alt_text,
      caption: p.caption,
      width: p.width,
      height: p.height,
      tags: p.tags ? p.tags.split(',') : [],
    })),
  };

  // `version` is derived from the content itself, never from the clock — a
  // timestamp here would change the body on every request and defeat the ETag.
  const version = await etagFor(JSON.stringify(core));
  const payload = { version: version.slice(1, -1), ...core };
  const body = JSON.stringify(payload);
  const etag = await etagFor(body);

  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  const maxAge = env.PUBLIC_CACHE_SECONDS || '60';
  return json(payload, {
    headers: {
      ETag: etag,
      'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=600`,
    },
  });
}

const initialsFrom = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join('');

function photoUrl(photos, id) {
  const p = photos.find((x) => x.id === id);
  return p ? { url: `/api/photos/${p.r2_key}`, alt: p.alt_text } : null;
}

async function servePhoto(key, env) {
  const obj = await env.PHOTOS.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: obj.httpEtag,
    },
  });
}

// ---------------------------------------------------------------------- auth

async function handleLogin(request, env) {
  const ip = clientIp(request);
  const throttle = await checkThrottle(env.DB, ip);
  if (throttle.locked) {
    return json({ error: 'Too many attempts. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(throttle.retryAfter) } });
  }

  let password;
  try {
    ({ password } = await request.json());
  } catch {
    return json({ error: 'Bad request' }, { status: 400 });
  }

  const ok = await verifyPassword(password || '', env.ADMIN_PASSWORD_HASH);
  if (!ok) {
    await recordFailure(env.DB, ip);
    return json({ error: 'Incorrect password' }, { status: 401 });
  }

  await clearFailures(env.DB, ip);
  await sweepExpired(env.DB);
  const ttl = Number(env.SESSION_TTL_HOURS || 12);
  const { id, expires } = await createSession(env.DB, ttl);
  return json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie(id, expires) } });
}

// Photos arrive already resized and webp-encoded by the browser (the Workers
// runtime has no sharp), so this just validates and stores.
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/webp', 'image/jpeg', 'image/png']);

async function handlePhotoUpload(request, env) {
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return json({ error: 'No file supplied' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return json({ error: 'Image is larger than 8 MB after resizing' }, { status: 413 });
  }
  const type = file.type || 'image/webp';
  if (!ALLOWED_TYPES.has(type)) {
    return json({ error: `Unsupported image type: ${type}` }, { status: 415 });
  }

  // Random key, so an uploaded filename can never collide or path-traverse.
  const rand = [...crypto.getRandomValues(new Uint8Array(12))]
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  const ext = type.split('/')[1].replace('jpeg', 'jpg');
  const key = `${new Date().toISOString().slice(0, 7)}/${rand}.${ext}`;

  await env.PHOTOS.put(key, file.stream(), { httpMetadata: { contentType: type } });

  const row = await env.DB.prepare(`
    INSERT INTO photos (r2_key, alt_text, caption, width, height, content_type, bytes,
                        tags, sort_order, published)
    VALUES (?1, ?2, '', ?3, ?4, ?5, ?6, '',
            (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM photos), 1)
    RETURNING *
  `).bind(
    key,
    String(form.get('alt_text') || ''),
    Number(form.get('width')) || null,
    Number(form.get('height')) || null,
    type,
    file.size,
  ).first();

  return json({ item: row }, { status: 201 });
}

// ---------------------------------------------------------------- admin CRUD

async function handleAdminApi(request, env, path) {
  const session = await getSession(env.DB, request);
  if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

  // SameSite=Strict already blocks cross-site sends; requiring a custom header
  // means a plain HTML form POST can't reach these either.
  if (request.method !== 'GET' && request.headers.get('X-CSB-Admin') !== '1') {
    return json({ error: 'Missing X-CSB-Admin header' }, { status: 403 });
  }

  const [, entity, segment] = path.split('/'); // 'admin/<entity>/<id|reorder>'
  if (!ENTITIES[entity]) return json({ error: 'Unknown collection' }, { status: 404 });

  if (entity === 'photos' && segment === 'upload' && request.method === 'POST') {
    return handlePhotoUpload(request, env);
  }

  if (segment === 'reorder' && request.method === 'POST') {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.some((i) => !Number.isInteger(i))) {
      return json({ error: 'ids must be an array of integers' }, { status: 400 });
    }
    await reorder(env.DB, entity, ids);
    return json({ ok: true });
  }

  if (!segment) {
    if (request.method === 'GET') return json({ items: await list(env.DB, entity) });
    if (request.method === 'POST') {
      const { row, errors } = await create(env.DB, entity, await request.json());
      return errors ? json({ errors }, { status: 400 }) : json({ item: row }, { status: 201 });
    }
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const id = Number(segment);
  if (!Number.isInteger(id)) return json({ error: 'Bad id' }, { status: 400 });

  if (request.method === 'GET') {
    const row = await get(env.DB, entity, id);
    return row ? json({ item: row }) : json({ error: 'Not found' }, { status: 404 });
  }
  if (request.method === 'PATCH' || request.method === 'PUT') {
    const { row, errors } = await update(env.DB, entity, id, await request.json());
    return errors ? json({ errors }, { status: 400 }) : json({ item: row });
  }
  if (request.method === 'DELETE') {
    const gone = await remove(env.DB, entity, id);
    return gone ? json({ ok: true }) : json({ error: 'Not found' }, { status: 404 });
  }
  return json({ error: 'Method not allowed' }, { status: 405 });
}

// -------------------------------------------------------------------- router

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (!env.ADMIN_PASSWORD_HASH) {
      return json({ error: 'ADMIN_PASSWORD_HASH is not set' }, { status: 503 });
    }

    // The admin page itself is gated server-side: an unauthenticated visitor
    // is served the login screen and never receives the admin markup.
    if (path === '/admin' || path === '/admin/') {
      const session = await getSession(env.DB, request);
      return html(session ? renderAdmin() : renderLogin());
    }

    if (path === '/api/public/v1/content.json') {
      if (request.method !== 'GET') return json({ error: 'Method not allowed' }, { status: 405 });
      return publicContent(request, env);
    }

    if (path.startsWith('/api/photos/')) {
      return servePhoto(decodeURIComponent(path.slice('/api/photos/'.length)), env);
    }

    if (path === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }
    if (path === '/api/auth/logout' && request.method === 'POST') {
      await destroySession(env.DB, request);
      return json({ ok: true }, { headers: { 'Set-Cookie': clearCookie() } });
    }
    if (path === '/api/auth/me') {
      const session = await getSession(env.DB, request);
      return json({ authenticated: Boolean(session) });
    }

    if (path.startsWith('/api/admin/')) {
      return handleAdminApi(request, env, path.slice('/api/'.length));
    }

    return json({ error: 'Not found' }, { status: 404 });
  },
};

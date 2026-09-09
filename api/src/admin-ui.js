// Server-rendered admin shell. Unauthenticated visitors get renderLogin() and
// never receive the admin markup at all.

const PALETTE = `
  --navy:#395a86; --navy-dark:#2a4465; --navy-deep:#1e3252;
  --red:#c7494d; --red-dark:#a73a3e; --success:#2d6e3e;
  --cream:#f8f6f2; --cream-warm:#eee8db; --border:#d9d3c4;
  --ink:#1a1a1a; --ink-soft:#3d3d3d; --white:#fff;
`;

const BASE_CSS = `
  *{box-sizing:border-box}
  body{margin:0;background:var(--cream);color:var(--ink);
       font:15px/1.5 Inter,system-ui,-apple-system,sans-serif}
  h1,h2,h3{font-family:Merriweather,Georgia,serif;margin:0}
  button{font:inherit;cursor:pointer;border-radius:8px;border:1px solid transparent}
  .btn-primary{background:var(--navy);color:#fff;padding:10px 18px;font-weight:600}
  .btn-primary:hover{background:var(--navy-dark)}
  .btn-ghost{background:var(--white);border-color:var(--border);color:var(--navy);padding:7px 12px}
  .btn-ghost:hover{background:var(--cream-warm)}
  .btn-danger{background:var(--white);border-color:var(--border);color:var(--red);padding:7px 12px}
  .btn-danger:hover{background:#fdecea;border-color:var(--red)}
  input,textarea,select{font:inherit;width:100%;padding:9px 11px;border:1px solid var(--border);
       border-radius:8px;background:var(--white);color:var(--ink)}
  input:focus,textarea:focus,select:focus{outline:2px solid var(--navy);outline-offset:-1px;border-color:var(--navy)}
  label{display:block;font-size:12px;font-weight:700;text-transform:uppercase;
        letter-spacing:.05em;color:var(--ink-soft);margin:0 0 5px}
`;

export function renderLogin(error = '') {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Sign in — Covenant Senior Benefits</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Inter:wght@400;600;700&display=swap">
<style>:root{${PALETTE}}${BASE_CSS}
  body{display:grid;place-items:center;min-height:100vh;padding:20px}
  .card{background:var(--white);border:1px solid var(--border);border-radius:14px;
        padding:34px;width:100%;max-width:380px;box-shadow:0 10px 30px rgba(30,50,82,.10)}
  h1{font-size:21px;color:var(--navy);margin-bottom:6px}
  p.sub{color:var(--ink-soft);font-size:14px;margin:0 0 22px}
  .err{background:#fdecea;color:var(--red-dark);padding:10px 12px;border-radius:8px;
       font-size:14px;margin-bottom:14px;display:none}
  .err.show{display:block}
  button{width:100%;margin-top:16px}
</style></head><body>
<div class="card">
  <h1>Site Admin</h1>
  <p class="sub">Covenant Senior Benefits</p>
  <div class="err ${error ? 'show' : ''}" id="err">${error}</div>
  <form id="f">
    <label for="pw">Password</label>
    <input type="password" id="pw" autocomplete="current-password" autofocus required>
    <button class="btn-primary" type="submit">Sign in</button>
  </form>
</div>
<script>
const err = document.getElementById('err');
document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true; btn.textContent = 'Checking…';
  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: document.getElementById('pw').value }),
    });
    if (r.ok) { location.reload(); return; }
    const d = await r.json().catch(() => ({}));
    err.textContent = d.error || 'Sign-in failed'; err.classList.add('show');
  } catch { err.textContent = 'Network error'; err.classList.add('show'); }
  btn.disabled = false; btn.textContent = 'Sign in';
});
</script></body></html>`;
}

// Page slugs a piece of content can be tagged with. Empty tags = every page.
const PAGES = [
  'home', 'products', 'education', 'book-a-call', 'quiz',
  'medicare-part-a', 'medicare-part-b', 'medicare-advantage',
  'medicare-part-d', 'medicare-supplement', 'dental-vision-hearing',
  'hospital-indemnity', 'critical-illness', 'final-expense',
  'recovery-care', 'learn-turning-65', 'learn-medicare-101',
];

export function renderAdmin() {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Site Admin — Covenant Senior Benefits</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Inter:wght@400;500;600;700&display=swap">
<style>:root{${PALETTE}}${BASE_CSS}
  header{background:var(--navy);color:#fff;padding:14px 22px;display:flex;
         justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
  header h1{font-size:17px}
  header button{background:rgba(255,255,255,.14);color:#fff;padding:7px 13px;
                border-color:rgba(255,255,255,.3)}
  header button:hover{background:rgba(255,255,255,.24)}
  nav{display:flex;gap:4px;background:var(--white);padding:0 22px;
      border-bottom:1px solid var(--border);overflow-x:auto}
  nav button{background:none;border:none;border-bottom:3px solid transparent;
             padding:13px 16px;color:var(--ink-soft);font-weight:600;white-space:nowrap;border-radius:0}
  nav button[aria-selected=true]{color:var(--navy);border-bottom-color:var(--red)}
  main{max-width:900px;margin:0 auto;padding:24px 22px 70px}
  .bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px}
  .bar h2{font-size:19px;color:var(--navy)}
  .hint{color:var(--ink-soft);font-size:13px;margin:-6px 0 18px}
  .card{background:var(--white);border:1px solid var(--border);border-radius:12px;
        padding:16px;margin-bottom:11px;display:flex;gap:13px;align-items:flex-start}
  .card.dragging{opacity:.4}
  .card.over{border-color:var(--navy);border-style:dashed}
  .grip{cursor:grab;color:#b9b2a2;font-size:19px;line-height:1;padding-top:2px;user-select:none}
  .body{flex:1;min-width:0}
  .body .q{margin:0 0 7px;line-height:1.45}
  .meta{font-size:13px;color:var(--ink-soft)}
  .tags{margin-top:8px;display:flex;flex-wrap:wrap;gap:5px}
  .tag{background:var(--cream-warm);color:var(--navy);font-size:11px;font-weight:600;
       padding:3px 8px;border-radius:20px}
  .tag.all{background:#e8f0f9}
  .acts{display:flex;flex-direction:column;gap:6px;flex-shrink:0}
  .draft{opacity:.55}
  .pill{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
        padding:3px 8px;border-radius:20px;background:var(--cream-warm);color:var(--ink-soft)}
  .pill.live{background:#e8f5e9;color:var(--success)}
  dialog{border:none;border-radius:14px;padding:0;max-width:560px;width:calc(100% - 32px);
         box-shadow:0 24px 60px rgba(30,50,82,.28)}
  dialog::backdrop{background:rgba(30,50,82,.42)}
  .dlg-head{padding:19px 22px 0}
  .dlg-head h3{font-size:18px;color:var(--navy)}
  form.edit{padding:16px 22px 22px;display:grid;gap:14px;max-height:72vh;overflow-y:auto}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}
  .chip{font-size:11px;padding:4px 9px;border-radius:20px;border:1px solid var(--border);
        background:var(--white);color:var(--ink-soft)}
  .chip[aria-pressed=true]{background:var(--navy);color:#fff;border-color:var(--navy)}
  .dlg-foot{display:flex;justify-content:space-between;gap:10px;padding-top:4px}
  .empty{text-align:center;padding:46px 20px;color:var(--ink-soft);
         background:var(--white);border:1px dashed var(--border);border-radius:12px}
  .thumb{width:74px;height:74px;object-fit:cover;border-radius:8px;flex-shrink:0;background:var(--cream-warm)}
  .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(80px);
         background:var(--navy-deep);color:#fff;padding:11px 20px;border-radius:9px;
         font-size:14px;transition:transform .22s;z-index:99;box-shadow:0 8px 24px rgba(0,0,0,.24)}
  .toast.show{transform:translateX(-50%) translateY(0)}
  .toast.bad{background:var(--red-dark)}
  @media(max-width:560px){.row{grid-template-columns:1fr}}
</style></head><body>
<header>
  <h1>Covenant Senior Benefits — Site Admin</h1>
  <button id="logout">Sign out</button>
</header>
<nav>
  <button data-tab="testimonials" aria-selected="true">Testimonials</button>
  <button data-tab="locations" aria-selected="false">Locations</button>
  <button data-tab="photos" aria-selected="false">Photo Gallery</button>
  <button data-tab="videos" aria-selected="false">Videos</button>
</nav>
<main>
  <div class="bar">
    <h2 id="title">Testimonials</h2>
    <div style="display:flex;gap:8px">
      <input type="file" id="file" accept="image/*" multiple hidden>
      <button class="btn-primary" id="add">Add new</button>
    </div>
  </div>
  <p class="hint" id="hint"></p>
  <div id="list"></div>
</main>
<dialog id="dlg"><div class="dlg-head"><h3 id="dlgTitle">Edit</h3></div>
  <form class="edit" id="editForm" method="dialog"></form>
</dialog>
<div class="toast" id="toast"></div>
<script>
const PAGES = ${JSON.stringify(PAGES)};
let tab = 'testimonials';
let items = [];
let editingId = null;

const HINTS = {
  testimonials: 'Drag to reorder — this is the order they appear on the site. Leave Pages empty to show a testimonial on every page.',
  locations: 'Places Joey has presented. Drag to reorder. Leave Pages empty to show everywhere.',
  videos: 'The video that plays in each slot on the site. Paste a YouTube ID, a Vimeo ID, or a direct file URL \u2014 whichever you have. Slots are fixed; edit them rather than adding new ones.',
  photos: 'Upload photos for the galleries. Images are resized in your browser before uploading, so large files are fine.',
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg, bad = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (bad ? ' bad' : '');
  clearTimeout(t._h);
  t._h = setTimeout(() => { t.className = 'toast' + (bad ? ' bad' : ''); }, 2600);
}

async function api(path, opts = {}) {
  const r = await fetch('/api' + path, {
    ...opts,
    headers: { 'X-CSB-Admin': '1', ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) },
  });
  if (r.status === 401) { location.reload(); throw new Error('signed out'); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d.errors && d.errors.join(', ')) || d.error || 'Request failed');
  return d;
}

const tagChips = (tags) => tags
  ? tags.split(',').filter(Boolean).map((t) => '<span class="tag">' + esc(t) + '</span>').join('')
  : '<span class="tag all">All pages</span>';

function cardFor(it) {
  const live = it.published
    ? '<span class="pill live">Live</span>'
    : '<span class="pill">Draft</span>';
  let body;
  if (tab === 'testimonials') {
    body = '<p class="q">“' + esc(it.quote) + '”</p>'
      + '<div class="meta"><strong>' + esc(it.author_name) + '</strong>'
      + (it.author_meta ? ' · ' + esc(it.author_meta) : '')
      + ' · ' + '★'.repeat(it.stars) + '</div>';
  } else if (tab === 'locations') {
    body = '<p class="q"><strong>' + esc(it.venue) + '</strong></p>'
      + '<div class="meta">' + esc([it.city, it.state].filter(Boolean).join(', '))
      + (it.event_date ? ' · ' + esc(it.event_date) : '') + '</div>'
      + (it.description ? '<div class="meta" style="margin-top:5px">' + esc(it.description) + '</div>' : '');
  } else if (tab === 'videos') {
    const src = it.youtube_id ? 'YouTube · ' + it.youtube_id
      : it.vimeo_id ? 'Vimeo · ' + it.vimeo_id
      : it.direct_url ? 'Direct file' : null;
    const len = it.duration_seconds
      ? Math.floor(it.duration_seconds / 60) + ':' + String(it.duration_seconds % 60).padStart(2, '0')
      : '';
    body = '<p class="q"><strong>' + esc(it.title || it.slot) + '</strong></p>'
      + '<div class="meta"><code>' + esc(it.slot) + '</code> · ' + esc(it.aspect_ratio)
      + (len ? ' · ' + len : '') + '</div>'
      + '<div class="meta" style="margin-top:5px">'
      + (src ? esc(src) : '<span style="color:var(--red)">No video source set yet</span>')
      + '</div>';
  } else {
    body = '<p class="q"><strong>' + esc(it.alt_text || '(no description)') + '</strong></p>'
      + '<div class="meta">' + esc(it.caption || '') + '</div>';
  }
  const thumb = tab === 'photos'
    ? '<img class="thumb" src="/api/photos/' + encodeURIComponent(it.r2_key) + '" alt="">'
    : '';
  return '<div class="card' + (it.published ? '' : ' draft') + '" draggable="true" data-id="' + it.id + '">'
    + '<span class="grip" title="Drag to reorder">☰</span>' + thumb
    + '<div class="body">' + body + '<div class="tags">' + live + tagChips(it.tags) + '</div></div>'
    + '<div class="acts">'
    + '<button class="btn-ghost" data-act="edit">Edit</button>'
    + '<button class="btn-ghost" data-act="toggle">' + (it.published ? 'Unpublish' : 'Publish') + '</button>'
    + '<button class="btn-danger" data-act="del">Delete</button>'
    + '</div></div>';
}

async function load() {
  document.getElementById('title').textContent =
    tab === 'photos' ? 'Photo Gallery' : tab[0].toUpperCase() + tab.slice(1);
  document.getElementById('hint').textContent = HINTS[tab];
  document.getElementById('add').textContent = tab === 'photos' ? 'Upload photos' : 'Add new';
  const list = document.getElementById('list');
  list.innerHTML = '<div class="empty">Loading…</div>';
  try {
    ({ items } = await api('/admin/' + tab));
    list.innerHTML = items.length
      ? items.map(cardFor).join('')
      : '<div class="empty">Nothing here yet. Click <strong>'
        + (tab === 'photos' ? 'Upload photos' : 'Add new') + '</strong> to start.</div>';
  } catch (e) { list.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; }
}

// ---- edit dialog ----------------------------------------------------------
const FIELDS = {
  testimonials: [
    { k: 'quote', l: 'Quote', t: 'textarea', rows: 4 },
    { k: 'author_name', l: 'Name', t: 'text', half: true },
    { k: 'stars', l: 'Stars', t: 'select', def: 5, half: true,
      opts: [[5, '★★★★★'], [4, '★★★★'], [3, '★★★'], [2, '★★'], [1, '★']] },
    { k: 'author_meta', l: 'Details (state, age, plan)', t: 'text' },
    { k: 'initials', l: 'Avatar initials (auto if blank)', t: 'text' },
  ],
  locations: [
    { k: 'venue', l: 'Venue / event', t: 'text' },
    { k: 'city', l: 'City', t: 'text', half: true },
    { k: 'state', l: 'State', t: 'text', half: true },
    { k: 'event_date', l: 'Date', t: 'date' },
    { k: 'description', l: 'Description', t: 'textarea', rows: 3 },
  ],
  videos: [
    { k: 'slot', l: 'Slot (the place on the site this fills)', t: 'text' },
    { k: 'title', l: 'Title', t: 'text' },
    { k: 'youtube_id', l: 'YouTube ID', t: 'text', half: true },
    { k: 'vimeo_id', l: 'Vimeo ID', t: 'text', half: true },
    { k: 'direct_url', l: 'Or a direct video URL (.mp4)', t: 'text' },
    { k: 'poster_url', l: 'Poster image URL (optional)', t: 'text' },
    { k: 'duration_seconds', l: 'Length in seconds', t: 'number', half: true },
    { k: 'aspect_ratio', l: 'Shape', t: 'select', def: '16/9', half: true,
      opts: [['16/9', 'Landscape (16:9)'], ['9/16', 'Vertical (9:16)'],
             ['1/1', 'Square (1:1)'], ['4/3', 'Classic (4:3)']] },
  ],
  photos: [
    { k: 'alt_text', l: 'Description (for screen readers)', t: 'text' },
    { k: 'caption', l: 'Caption', t: 'text' },
  ],
};

function openEdit(it) {
  editingId = it ? it.id : null;
  const f = document.getElementById('editForm');
  const v = it || {};
  document.getElementById('dlgTitle').textContent =
    (it ? 'Edit ' : 'New ') + tab.replace(/s$/, '');

  const pairs = [];
  let html = '';
  for (const fd of FIELDS[tab]) {
    let input;
    if (fd.t === 'textarea') {
      input = '<textarea name="' + fd.k + '" rows="' + fd.rows + '">' + esc(v[fd.k] || '') + '</textarea>';
    } else if (fd.t === 'select') {
      const cur = String(v[fd.k] ?? fd.def ?? '');
      input = '<select name="' + fd.k + '">' + fd.opts.map(([val, lab]) =>
        '<option value="' + esc(val) + '"' + (cur === String(val) ? ' selected' : '') + '>'
        + esc(lab) + '</option>').join('') + '</select>';
    } else {
      input = '<input type="' + fd.t + '" name="' + fd.k + '" value="' + esc(v[fd.k] || '') + '">';
    }
    const block = '<div><label>' + esc(fd.l) + '</label>' + input + '</div>';
    if (fd.half) { pairs.push(block); if (pairs.length === 2) { html += '<div class="row">' + pairs.join('') + '</div>'; pairs.length = 0; } }
    else { if (pairs.length) { html += '<div class="row">' + pairs.join('') + '</div>'; pairs.length = 0; } html += block; }
  }
  if (pairs.length) html += '<div class="row">' + pairs.join('') + '</div>';

  const active = (v.tags || '').split(',').filter(Boolean);
  html += '<div><label>Pages — leave all off to show everywhere</label>'
    + '<div class="chips">' + PAGES.map((p) =>
      '<button type="button" class="chip" data-page="' + p + '" aria-pressed="'
      + (active.includes(p) ? 'true' : 'false') + '">' + p + '</button>').join('')
    + '</div></div>';

  html += '<div><label>Status</label><select name="published">'
    + '<option value="1"' + (v.published !== 0 ? ' selected' : '') + '>Live on the site</option>'
    + '<option value="0"' + (v.published === 0 ? ' selected' : '') + '>Draft (hidden)</option>'
    + '</select></div>';

  html += '<div class="dlg-foot"><button type="button" class="btn-ghost" id="cancel">Cancel</button>'
    + '<button type="submit" class="btn-primary">' + (it ? 'Save changes' : 'Create') + '</button></div>';

  f.innerHTML = html;
  f.querySelectorAll('.chip').forEach((c) => {
    c.onclick = () => c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  });
  f.querySelector('#cancel').onclick = () => document.getElementById('dlg').close();
  document.getElementById('dlg').showModal();
}

document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const data = Object.fromEntries(new FormData(f).entries());
  data.published = Number(data.published);
  if ('stars' in data) data.stars = Number(data.stars);
  if ('duration_seconds' in data)
    data.duration_seconds = data.duration_seconds === '' ? null : Number(data.duration_seconds);
  data.tags = [...f.querySelectorAll('.chip[aria-pressed=true]')]
    .map((c) => c.dataset.page).join(',');
  try {
    if (editingId) await api('/admin/' + tab + '/' + editingId, { method: 'PATCH', body: JSON.stringify(data) });
    else await api('/admin/' + tab, { method: 'POST', body: JSON.stringify(data) });
    document.getElementById('dlg').close();
    toast('Saved');
    load();
  } catch (err) { toast(err.message, true); }
});

// ---- list actions ---------------------------------------------------------
document.getElementById('list').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = Number(btn.closest('.card').dataset.id);
  const it = items.find((x) => x.id === id);
  if (btn.dataset.act === 'edit') return openEdit(it);
  try {
    if (btn.dataset.act === 'toggle') {
      await api('/admin/' + tab + '/' + id, {
        method: 'PATCH', body: JSON.stringify({ published: it.published ? 0 : 1 }),
      });
      toast(it.published ? 'Hidden from the site' : 'Now live');
    } else {
      if (!confirm('Delete this permanently? This cannot be undone.')) return;
      await api('/admin/' + tab + '/' + id, { method: 'DELETE' });
      toast('Deleted');
    }
    load();
  } catch (err) { toast(err.message, true); }
});

// ---- drag to reorder ------------------------------------------------------
let dragId = null;
const list = document.getElementById('list');
list.addEventListener('dragstart', (e) => {
  const c = e.target.closest('.card'); if (!c) return;
  dragId = Number(c.dataset.id); c.classList.add('dragging');
});
list.addEventListener('dragend', (e) => {
  const c = e.target.closest('.card'); if (c) c.classList.remove('dragging');
  list.querySelectorAll('.over').forEach((x) => x.classList.remove('over'));
});
list.addEventListener('dragover', (e) => {
  e.preventDefault();
  const c = e.target.closest('.card'); if (!c || Number(c.dataset.id) === dragId) return;
  list.querySelectorAll('.over').forEach((x) => x.classList.remove('over'));
  c.classList.add('over');
});
list.addEventListener('drop', async (e) => {
  e.preventDefault();
  const target = e.target.closest('.card');
  if (!target || dragId == null) return;
  const targetId = Number(target.dataset.id);
  if (targetId === dragId) return;
  const order = items.map((i) => i.id);
  order.splice(order.indexOf(dragId), 1);
  order.splice(order.indexOf(targetId), 0, dragId);
  try {
    await api('/admin/' + tab + '/reorder', { method: 'POST', body: JSON.stringify({ ids: order }) });
    toast('Order saved');
    load();
  } catch (err) { toast(err.message, true); }
});

// ---- photo upload (resized in the browser; sharp can't run in Workers) ----
async function shrink(file, max = 1600, quality = 0.82) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
  return { blob, w, h };
}

document.getElementById('file').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  e.target.value = '';
  if (!files.length) return;
  let done = 0;
  for (const file of files) {
    try {
      toast('Processing ' + file.name + ' (' + (++done) + '/' + files.length + ')…');
      const { blob, w, h } = await shrink(file);
      const fd = new FormData();
      fd.append('file', blob, file.name.replace(/\.[^.]+$/, '') + '.webp');
      fd.append('width', w); fd.append('height', h);
      fd.append('alt_text', file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
      await api('/admin/photos/upload', { method: 'POST', body: fd });
    } catch (err) { toast(file.name + ': ' + err.message, true); }
  }
  toast('Uploaded ' + done + ' photo' + (done === 1 ? '' : 's'));
  load();
});

// ---- chrome ---------------------------------------------------------------
document.querySelectorAll('nav button').forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll('nav button').forEach((x) => x.setAttribute('aria-selected', 'false'));
    b.setAttribute('aria-selected', 'true');
    tab = b.dataset.tab;
    load();
  };
});
document.getElementById('add').onclick = () =>
  tab === 'photos' ? document.getElementById('file').click() : openEdit(null);
document.getElementById('logout').onclick = async () => {
  await fetch('/api/auth/logout', { method: 'POST', headers: { 'X-CSB-Admin': '1' } });
  location.reload();
};
load();
</script></body></html>`;
}

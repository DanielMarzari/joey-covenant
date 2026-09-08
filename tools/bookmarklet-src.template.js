/*
 * CSB → GHL Sync bookmarklet — popup edition
 * -------------------------------------------
 * Uses the GitHub API (api.github.com/repos/.../contents/...) with the
 * Accept: application/vnd.github.raw header to fetch file contents. The
 * REST API has proper CORS support (raw.githubusercontent.com does not
 * — it 404s the preflight OPTIONS when an Authorization header is sent).
 *
 * Opens the file picker in a small popup so the panel stays visible
 * while you paste into the GHL editor.
 *
 * Click the bookmarklet while a GHL custom-code editor is open:
 *   1. A small popup opens listing every ghl-ready/*.html file.
 *   2. Click a file → fetched from GitHub → copied to clipboard.
 *   3. Switch back to the GHL tab → Cmd+V into the editor → Save.
 *
 * Repo access:
 *   - If the repo is PUBLIC, leave TOKEN blank.
 *   - If PRIVATE, create a fine-grained PAT (Settings → Developer settings
 *     → Personal access tokens → Fine-grained) with:
 *       Repository access: only the joey-covenant repo
 *       Permissions: Contents = Read
 *     Copy this file to `bookmarklet-src.js` (gitignored), paste the token
 *     into TOKEN below, then rebuild the bookmarklet.
 *
 * Build:
 *   python3 tools/build-bookmarklet.py
 *   (Reads bookmarklet-src.js if present, else this template.)
 */
(function () {
  var OWNER = 'DanielMarzari';
  var REPO = 'joey-covenant';
  var BRANCH = 'main';
  var TOKEN = ''; // Fill in if repo is private (fine-grained PAT, contents:read)

  var BASE = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/ghl-ready/';

  var FILES = [
    ['Core pages', ['home.html', 'products.html', 'education.html']],
    ['Booking (split)', ['book-a-call-A.html', 'book-a-call-B.html']],
    ['Quiz (split)', ['quiz-A.html', 'quiz-B.html']],
    ['Core Medicare', [
      'medicare-part-a.html', 'medicare-part-b.html', 'medicare-advantage.html',
      'medicare-part-d.html', 'medicare-supplement.html'
    ]],
    ['Added protection', [
      'dental-vision-hearing.html', 'hospital-indemnity.html', 'critical-illness.html',
      'final-expense.html', 'recovery-care.html'
    ]],
    ['Video sub-pages', ['learn-turning-65.html', 'learn-medicare-101.html']]
  ];

  var w = window.open('', 'csb_sync_popup', 'width=420,height=720,scrollbars=yes,resizable=yes');
  if (!w) { alert('Popup blocked. Allow pop-ups for this site and click the bookmarklet again.'); return; }
  w.focus();
  var wd = w.document;

  wd.title = 'CSB → GHL Sync';
  wd.body.innerHTML = '';
  wd.body.style.cssText = 'margin:0;font:14px system-ui,-apple-system,sans-serif;padding:14px;background:#fff;color:#1a1a1a;';

  var h = wd.createElement('h1');
  h.textContent = 'CSB → GHL Sync';
  h.style.cssText = 'font-size:16px;color:#395a86;margin:0 0 6px;';
  wd.body.appendChild(h);

  var sub = wd.createElement('div');
  sub.textContent = 'Click a file → copies latest to clipboard. Then switch back to GHL, ⌘V, Save.';
  sub.style.cssText = 'font-size:12px;color:#666;margin-bottom:10px;line-height:1.4;';
  wd.body.appendChild(sub);

  var toast = wd.createElement('div');
  toast.style.cssText = 'font-size:13px;padding:8px 10px;background:#f8f6f2;border-radius:6px;margin-bottom:10px;min-height:20px;line-height:1.35;';
  toast.textContent = 'Ready.';
  wd.body.appendChild(toast);

  FILES.forEach(function (group) {
    var label = wd.createElement('div');
    label.style.cssText = 'font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.05em;margin:12px 0 4px;';
    label.textContent = group[0];
    wd.body.appendChild(label);

    group[1].forEach(function (f) {
      var b = wd.createElement('button');
      b.textContent = f;
      b.style.cssText = 'display:block;width:100%;text-align:left;padding:8px 10px;margin:3px 0;border:1px solid #d9d3c4;border-radius:6px;background:#fff;cursor:pointer;font:13px Menlo,Consolas,monospace;color:#395a86;';
      b.onmouseover = function () { b.style.background = '#eee8db'; b.style.borderColor = '#c7494d'; };
      b.onmouseout = function () { b.style.background = '#fff'; b.style.borderColor = '#d9d3c4'; };
      b.onclick = function () {
        toast.style.background = '#f8f6f2'; toast.style.color = '#666';
        toast.textContent = 'Fetching ' + f + '…';

        // GitHub REST API with Accept: raw returns file bytes directly (no base64).
        // Authorization uses Bearer per GitHub's current recommendation.
        var opts = { cache: 'no-store', headers: { Accept: 'application/vnd.github.raw' } };
        if (TOKEN) opts.headers.Authorization = 'Bearer ' + TOKEN;

        w.fetch(BASE + f + '?ref=' + BRANCH + '&t=' + Date.now(), opts)
          .then(function (r) {
            if (!r.ok) {
              var hint = (r.status === 401 || r.status === 403 || r.status === 404)
                ? ' — check TOKEN or repo visibility.' : '';
              throw new Error('HTTP ' + r.status + hint);
            }
            return r.text();
          })
          .then(function (txt) {
            return w.navigator.clipboard.writeText(txt).then(function () {
              toast.style.background = '#e8f5e9'; toast.style.color = '#2d6e3e';
              toast.innerHTML = '<strong>✓ Copied</strong> ' + f + ' (' + (txt.length / 1024).toFixed(1) + ' KB)<br><span style="font-size:11px;color:#555">Switch back to the GHL tab and ⌘V into the editor.</span>';
            });
          })
          .catch(function (err) {
            toast.style.background = '#fdecea'; toast.style.color = '#c7494d';
            toast.textContent = 'Error: ' + err.message;
          });
      };
      wd.body.appendChild(b);
    });
  });
})();

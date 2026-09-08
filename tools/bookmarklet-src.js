/*
 * CSB → GHL Sync bookmarklet
 * ---------------------------
 * Click the bookmarklet while a GHL custom-code editor is open. A small
 * panel appears in the top-right listing every ghl-ready/*.html file.
 * Click a file → the latest content is fetched from GitHub and copied
 * to the clipboard. Then Cmd+V (Ctrl+V on Windows) into the editor.
 *
 * Repo access:
 *   - If the repo is PUBLIC, leave TOKEN blank.
 *   - If PRIVATE, create a fine-grained PAT (Settings → Developer settings
 *     → Personal access tokens → Fine-grained) with:
 *       Repository access: only the joey-covenant repo
 *       Permissions: Contents = Read
 *     Paste it into TOKEN below, then rebuild the bookmarklet.
 *
 * Build:
 *   python3 tools/build-bookmarklet.py
 *   (Reads this file, minifies, URL-encodes, prints javascript: URL)
 */
(function () {
  var OWNER = 'DanielMarzari';
  var REPO = 'joey-covenant';
  var BRANCH = 'main';
  var TOKEN = ''; // Fill in if repo is private (fine-grained PAT, contents:read)

  var BASE = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/ghl-ready/';

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

  // Toggle: if panel already exists, close it and bail
  var existing = document.getElementById('csb-sync-panel');
  if (existing) { existing.remove(); return; }

  var p = document.createElement('div');
  p.id = 'csb-sync-panel';
  p.style.cssText = 'position:fixed;top:16px;right:16px;background:#fff;border:2px solid #395a86;border-radius:12px;padding:14px 16px;box-shadow:0 16px 40px rgba(0,0,0,0.2);z-index:2147483647;font:14px system-ui,-apple-system,sans-serif;width:320px;max-height:85vh;overflow-y:auto;color:#1a1a1a;';

  var head = document.createElement('div');
  head.style.cssText = 'font-weight:700;color:#395a86;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;font-size:15px;';
  var headTitle = document.createElement('span');
  headTitle.textContent = 'CSB → GHL Sync';
  head.appendChild(headTitle);
  var close = document.createElement('button');
  close.textContent = '×';
  close.style.cssText = 'border:none;background:none;font-size:22px;cursor:pointer;color:#999;padding:0 6px;line-height:1;';
  close.onclick = function () { p.remove(); };
  head.appendChild(close);
  p.appendChild(head);

  var sub = document.createElement('div');
  sub.style.cssText = 'font-size:12px;color:#666;margin-bottom:10px;';
  sub.textContent = 'Click a file to copy the latest to your clipboard, then paste into the custom-code editor and Save.';
  p.appendChild(sub);

  var toast = document.createElement('div');
  toast.style.cssText = 'font-size:13px;padding:8px 10px;background:#f8f6f2;border-radius:6px;margin-bottom:10px;min-height:20px;line-height:1.35;';
  toast.textContent = 'Ready.';
  p.appendChild(toast);

  FILES.forEach(function (group) {
    var label = document.createElement('div');
    label.style.cssText = 'font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.05em;margin:10px 0 4px;';
    label.textContent = group[0];
    p.appendChild(label);

    group[1].forEach(function (f) {
      var b = document.createElement('button');
      b.textContent = f;
      b.style.cssText = 'display:block;width:100%;text-align:left;padding:7px 10px;margin:2px 0;border:1px solid #d9d3c4;border-radius:6px;background:#fff;cursor:pointer;font:13px Menlo,Consolas,monospace;color:#395a86;';
      b.onmouseover = function () { b.style.background = '#eee8db'; b.style.borderColor = '#c7494d'; };
      b.onmouseout = function () { b.style.background = '#fff'; b.style.borderColor = '#d9d3c4'; };
      b.onclick = function () {
        toast.style.background = '#f8f6f2';
        toast.style.color = '#666';
        toast.textContent = 'Fetching ' + f + '…';

        var opts = { cache: 'no-store' };
        if (TOKEN) opts.headers = { Authorization: 'token ' + TOKEN };

        fetch(BASE + f + '?t=' + Date.now(), opts)
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status + ' — make repo public, or set TOKEN in the bookmarklet.');
            return r.text();
          })
          .then(function (txt) {
            return navigator.clipboard.writeText(txt).then(function () {
              toast.style.background = '#e8f5e9';
              toast.style.color = '#2d6e3e';
              toast.innerHTML = '<strong>✓ Copied</strong> ' + f + ' <span style="color:#999">(' + (txt.length / 1024).toFixed(1) + ' KB)</span><br><span style="font-size:11px;color:#555">Now ⌘V into the custom-code editor and Save.</span>';
            });
          })
          .catch(function (err) {
            toast.style.background = '#fdecea';
            toast.style.color = '#c7494d';
            toast.textContent = 'Error: ' + err.message;
          });
      };
      p.appendChild(b);
    });
  });

  document.body.appendChild(p);
})();

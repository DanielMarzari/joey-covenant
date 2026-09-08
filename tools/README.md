# CSB → GHL Sync Tools

A small bookmarklet that fetches the latest `ghl-ready/*.html` from this repo
and copies it to your clipboard — one click, one paste, one save.

## Files

- `bookmarklet-src.js` — Readable source of the bookmarklet (edit this).
- `build-bookmarklet.py` — Minifies + URL-encodes → `bookmarklet.txt`.
- `bookmarklet.txt` — The `javascript:` URL to paste into a Chrome bookmark.

## Setup (one time)

### 1. Decide how the bookmarklet reads the repo

**Option A — Make the repo public** (simplest, recommended)
1. GitHub → repo Settings → General → Danger Zone → Change visibility → Public.
2. Skip step 2. The bookmarklet works as-is.

**Option B — Keep the repo private**
1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained
   tokens → Generate new token.
   - Repository access: **Only select repositories** → pick `joey-covenant`.
   - Permissions: **Contents = Read** (nothing else).
   - Expiration: 90 days or your preference.
2. Copy the token, paste it into `TOKEN = ''` at the top of `bookmarklet-src.js`.
3. Rebuild: `python3 tools/build-bookmarklet.py`
4. The rebuilt `bookmarklet.txt` contains your token. **Do not commit it.**
   (Add `tools/bookmarklet.txt` to `.gitignore` in that case.)

### 2. Install the bookmarklet in Chrome

1. Show the bookmarks bar (`⌘⇧B` on Mac).
2. Right-click the bookmarks bar → **Add page**.
3. Name: `CSB Sync`
4. URL: paste the entire contents of `tools/bookmarklet.txt` (starts with `javascript:`).
5. Save.

## Usage

1. In GHL, open the funnel/page and click into the custom-code element you want to update.
2. Click the **CSB Sync** bookmarklet in your bookmarks bar.
3. A small panel appears in the top-right listing every ghl-ready file.
4. Click the file you want. The panel confirms "✓ Copied … (N KB)".
5. `⌘V` inside the custom-code editor → **Save** in GHL.
6. Repeat for the next page. Click the bookmarklet again to close the panel.

## Rebuilding after code changes

Any time you edit the file list, TOKEN, or styling in `bookmarklet-src.js`:

```bash
python3 tools/build-bookmarklet.py
```

Then re-paste `tools/bookmarklet.txt` into your bookmark URL.

## Notes

- The bookmarklet uses `navigator.clipboard.writeText`, which requires a user
  gesture (the button click satisfies that).
- Fetches are cache-busted (`?t=<timestamp>`) so you always get the latest
  commit on `main` — no waiting on CDNs.
- The panel toggles: click the bookmarklet again to close it.
- Works on any GHL plan; no API access required.

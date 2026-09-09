# CSB Admin — content API + admin UI

A Cloudflare Worker serving `/admin` and `/api/*` on
`www.covenantseniorbenefits.com`. Every other path falls through to
GoHighLevel untouched — the existing `www` CNAME is never modified.

Joey signs in at `/admin` and edits **testimonials**, **locations**,
**photos**, and **videos**. The public pages read one cached JSON feed.

## Why a Worker rather than the Oracle box

The client's domain is already on Cloudflare (registrar + DNS), so this runs
entirely on the client's own infrastructure — nothing personal in their stack,
and the whole thing transfers with the account. $0 on free tiers.

## Design notes

**Same-origin.** `/admin`, `/api`, and the public pages share an origin, so
there is no CORS anywhere, and the session is a real `HttpOnly; Secure;
SameSite=Strict` cookie rather than a token in `sessionStorage` that page JS
(or an XSS) could read.

**The admin page is gated server-side.** An unauthenticated visitor is served
the login screen and never receives the admin markup at all.

**Progressive enhancement, always.** The public snippet only *replaces* markup
that is already in the page, and only when the fetch succeeds and returns
something publishable. If the Worker is down, undeployed, or a collection is
empty, visitors see the hand-written fallback content. No section can go blank.

**`version` is content-derived, never a timestamp.** A clock in the payload
would change the body on every request and silently kill the ETag.

**Photos are resized in the browser** (canvas → WebP) because the Workers
runtime has no `sharp`. Uploads are hand-picked and low-volume, so this is a
fit rather than a workaround.

**Tags target pages.** An item tagged `home,medicare-advantage` appears only on
those pages; an untagged item appears everywhere. One dataset feeds every page
without a separate admin screen per page.

## Local development

```bash
npm install
npm run hash -- 'some-long-password'     # → paste into .dev.vars
echo 'ADMIN_PASSWORD_HASH=pbkdf2$...' > .dev.vars
npm run db:init:local
npm run dev                              # http://localhost:8787/admin
```

`.dev.vars` is gitignored — it holds a password hash, never commit it.

## First deploy

Needs access to the Cloudflare account holding `covenantseniorbenefits.com`.

```bash
npx wrangler login
npx wrangler d1 create csb               # copy database_id into wrangler.toml
npx wrangler r2 bucket create csb-photos
npm run db:init:remote
npx wrangler secret put ADMIN_PASSWORD_HASH
npm run deploy
```

The routes in `wrangler.toml` bind `/api/*` and `/admin*` on the live domain.
They are Worker *routes*, not DNS records — nothing about the existing GHL
setup changes.

## Wiring a page

Mark any container and the snippet fills it, leaving the existing markup as the
fallback:

```html
<div class="testimonial-grid"
     data-csb-slot="testimonials"   <!-- testimonials | locations | gallery -->
     data-csb-page="home"           <!-- optional: only items tagged for this page -->
     data-csb-limit="3">            <!-- optional -->
  <!-- hand-written cards stay here as the fallback -->
</div>
```

Then append `tools/csb-content-snippet.html` before the closing `.csb-page`
`</div>`. It early-returns when a page has no slots, and one fetch serves every
slot on the page.

Currently wired: `home.html` (testimonials), `presentations.html` (locations,
gallery). The two `learn-*` pages read `videos` from the same feed via their own
facade script.

## Notes

`npm audit` flags `sharp`, pulled in transitively by wrangler. `audit fix
--force` *downgrades* wrangler, and `sharp` is dev-tooling only — it never
reaches the deployed Worker. Left as-is deliberately.

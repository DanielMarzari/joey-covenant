# Internal URL plan

`apply_seo.py` rewrites every `href` sitewide. **Each rename also needs a 301 redirect
in GHL** (Sites → Redirects) or the old URL 404s and loses whatever authority it has.

## Applied automatically

| Old | New | Links | Why |
|---|---|---|---|
| `/home` | `/` | 72 | A homepage must live at the root. `/home` and `/` are two URLs serving one page — Google picks one and splits authority between them. This is the single most valuable fix here. |
| `/education-page` | `/learn` | 6 | **Both URLs already serve the same Education page** — a live duplicate. `/learn` has 36 inbound links to `/education-page`'s 6, so `/learn` wins and `/education-page` is retired. |
| `/learn-medicare-101` | `/already-on-medicare` | 2 | The slug actively misdescribes the page. Its H1 is *"Already on Medicare? Let's Make Sure It's Still the Right Fit"* — an annual-review page, not a Medicare 101 primer. The real Medicare 101 page is at `/learn`, so the current slug competes with it for the wrong query. |
| `/learn-turning-65` | `/turning-65` | 3 | Drops a redundant prefix. `turning 65 medicare` is a high-intent query and the shorter slug matches it more cleanly. |

`/home#services` becomes `/#services` automatically — the anchor is preserved.

## Needs a decision — not applied

**1. Two strong pages are nearly orphaned.** `/turning-65` (1,324 words) has **3** inbound
links and `/already-on-medicare` (1,374 words) has **2**. Meanwhile the nav's *"Turning 65"*,
*"Annual Plan Review"* and *"Leaving Employer Plan"* items all point at `/#services` — an anchor
on the homepage — instead of the dedicated pages that already exist.

That is the highest-value internal-linking fix on the site: two substantial pages targeting
valuable queries are getting almost no internal signal, while the links that should feed them
point at a homepage anchor.

Suggested repointing:

| Nav item | Now | Should be |
|---|---|---|
| Turning 65 | `/#services` | `/turning-65` |
| Annual Plan Review | `/#services` | `/already-on-medicare` |
| Leaving Employer Plan | `/#services` | *(no page exists — see below)* |

**Built.** `/leaving-employer-coverage` now exists (1,400 words, six real FAQs) and all three
footer *Services* links point at their proper pages. While wiring it up I found the homepage
*"Leaving Employer Coverage"* card had always pointed at `/learn-turning-65` — the wrong page.
That is now fixed.

Add a 301 for it only if you had a placeholder URL live; otherwise it is a new page.

**2. `/products` → `/medicare-plans` (optional).** "Products" is not what anyone searches.
`/medicare-plans` matches real query language. But it carries 53 inbound links and is
established, so this is a judgement call — worth it if the site is young, skip it if the URL
already has traction in Search Console.

## Redirects to create in GHL

```
/home               → /
/education-page     → /learn
/learn-medicare-101 → /already-on-medicare
/learn-turning-65   → /turning-65
```

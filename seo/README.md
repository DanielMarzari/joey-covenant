# SEO tooling

| File | What it is |
|---|---|
| `csb_data.py` | Single source of truth — business facts, page→URL map, FAQ allowlist, placeholders. **Edit this**, not the generated markup. |
| `apply_seo.py` | Injects JSON-LD and rewrites internal URLs across `ghl-ready/*.html`. Idempotent. |
| `ghl-page-settings.md` | Titles + meta descriptions to paste into GHL. Cannot be automated from this repo. |
| `url-plan.md` | URL renames, rationale, and the redirects GHL needs. |

```bash
python3 seo/apply_seo.py --dry-run    # preview every change
python3 seo/apply_seo.py              # write
python3 seo/apply_seo.py --list-faq   # audit FAQ candidates before allowlisting
```

Re-running replaces the block between `<!-- SEO:JSONLD:START -->` and `<!-- SEO:JSONLD:END -->`
rather than appending, so it is safe after other agents edit the same files.

## Licensing identifiers — resolved

Three distinct numbers, deliberately kept on separate schema nodes:

| Value | Where it lands |
|---|---|
| Agency NPN `22186072` | `identifier` on the `InsuranceAgency` node |
| Joey's individual NPN `21431861` | `identifier` on the `Person` node |
| PA producer licence `1228636` | `hasCredential` on the `Person`, recognised by the PA Insurance Department |
| Pennie Certified Broker | `hasCredential` on the `Person`, recognised by Pennie — backs `/individual-health-aca` |

The `Person` node is emitted in full on `/` and on `/individual-health-aca` (via
`csb_data.PERSON_PAGES`), because the Pennie certification is material to the ACA
page and search engines do not reliably resolve `@id` references across pages.

Still optional, in `csb_data.py`:

- **`POSTAL_CODE`** — Allentown ZIP. Sharpens local relevance.
- **`STREET_ADDRESS`** — only if Joey wants a public street address. A city/state-only
  `PostalAddress` is valid; leave blank if he works from home.

## Not automated — content and compliance

**CMS disclaimer (compliance, not SEO).** Medicare marketing rules require this on any page
promoting MA or Part D plans:

> We do not offer every plan available in your area. Currently we represent [X] organizations
> which offer [Y] products in your area. Please contact Medicare.gov, 1-800-MEDICARE, or your
> local State Health Insurance Assistance Program (SHIP) to get information on all of your options.

Needs the real X/Y counts from Joey. Worth raising regardless of rankings.

**E-E-A-T.** Medicare is a "Your Money or Your Life" topic — Google applies its strictest
quality bar and weighs demonstrable expertise heavily. Currently missing sitewide:

- A byline on educational pages: *"Reviewed by Joey Guida, licensed insurance agent, NPN #…"*
- Visible `Last updated:` dates — Medicare figures change annually, and stale-looking
  content on a YMYL topic is penalised
- An About/bio page with credentials, years licensed, and carrier appointments

**Real FAQ content.** `/already-on-medicare` and `/leaving-employer-coverage` carry genuine
Q&A and are allowlisted. Every other page uses `<h3>?</h3>` for CTA cards and UI help, which
must **not** be marked up as FAQs — doing so is misleading structured data. Medicare has
enormous long-tail question volume ("does Medicare cover dental?", "when can I switch plans?"),
so real FAQ sections are worth adding to the plan pages. Write them with the `faq-grid` /
`faq-card` markup used on `/leaving-employer-coverage`, check the output with
`--list-faq`, then add the page to `csb_data.FAQ_PAGES`.

**Local SEO.** Every page footer now reads "Based in Allentown, Pennsylvania — serving the
Lehigh Valley…", so copy and schema agree. Beyond that, the decisive lever is a **Google
Business Profile**, which lives entirely outside this site; without one the `LocalBusiness`
markup has little to anchor to.

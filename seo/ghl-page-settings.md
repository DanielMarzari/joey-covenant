# GHL page settings — titles & meta descriptions

**Where these go:** GoHighLevel → Sites → Funnels/Websites → *the page* → ⚙ **Settings** → **SEO Meta Data**.
Nothing in this repo can set them; the `ghl-ready/*.html` files are body fragments with no `<head>`.

**What they do:** the Page Title becomes the blue clickable headline in Google results; the
Meta Description becomes the grey text underneath. Left blank, Google invents both from page
copy — usually badly. Titles are kept ≤60 characters and descriptions ≤160 so neither is
truncated with an ellipsis.

Set the **social share image** on each page too (same panel) — otherwise links pasted into
Facebook and SMS render as a bare grey box.

| URL | Page Title | Meta Description |
|---|---|---|
| `/` | Medicare Made Simple \| Allentown PA Medicare Agent | Free, no-pressure Medicare guidance from a licensed independent agent in Allentown, PA. Compare Advantage, Supplement and Part D plans at no cost to you. |
| `/products` | Medicare Plans & Coverage Options Explained | Compare Medicare Parts A, B, D, Advantage and Supplement plans — plus dental, hospital indemnity and final expense coverage. Independent, no-cost guidance. |
| `/learn` | Medicare 101: A Plain-English Guide for Beginners | New to Medicare? Learn how Parts A, B, C and D fit together, when to enroll, and how to avoid late penalties — in plain English, with no jargon. |
| `/turning-65` | Turning 65? Your Medicare Enrollment Checklist | Medicare starts the first day of your birthday month. Enroll in the three months prior for Day-1 coverage and avoid lifetime late penalties. |
| `/already-on-medicare` | Already on Medicare? Get a Free Annual Plan Review | Networks, formularies and copays change every year. A free annual review checks whether your current plan is still the best fit — and what it is costing you. |
| `/leaving-employer-coverage` | Leaving Employer Coverage: Medicare Deadlines | Retiring or laid off after 65? You get eight months to enroll in Part B, and COBRA does not pause that clock. How to avoid a lifetime penalty. |
| `/medicare-part-a` | Medicare Part A: Hospital Coverage Explained | Part A covers inpatient hospital care, skilled nursing, hospice and some home health. See what is covered, what it costs, and what it leaves out. |
| `/medicare-part-b` | Medicare Part B: What It Covers & What It Costs | Part B covers doctor visits, outpatient care, labs and preventive services — nearly everything outside the hospital. Here is what you pay and what is included. |
| `/medicare-part-d` | Medicare Part D Prescription Drug Coverage | Part D plans come from private carriers with formularies that vary. Learn how tiers, the deductible and late penalties work — and how to compare plans. |
| `/medicare-advantage` | Medicare Advantage: Honest Pros and Cons | Medicare Advantage works well for some seniors and poorly for others. An honest look at networks, copays and extra benefits before you enroll. |
| `/medicare-supplement` | Medicare Supplement (Medigap) Plans Compared | Medigap plans are standardized nationwide — Plan G is Plan G from any carrier — so you are shopping price and service. Compare rates with a licensed agent. |
| `/dental-vision-hearing` | Dental, Vision & Hearing Insurance for Seniors | Original Medicare does not cover routine dental, vision or hearing. Without a DVH plan these costs come straight out of savings. See your options. |
| `/critical-illness` | Cancer, Heart Attack & Stroke Insurance Plans | The hospital bill is not the biggest financial risk — it is everything after discharge. Cash benefits paid directly to you, to spend however you need. |
| `/hospital-indemnity` | Hospital Indemnity & Copay Protection Plans | Medicare Advantage leaves copays for hospital stays and skilled nursing. Hospital indemnity pays cash benefits to cover them. See how the two pair up. |
| `/recovery-care` | Recovery Care Coverage After a Hospital Stay | Recovery care pays cash benefits you choose how to use — skilled nursing, home health, rehab or in-home help. Most plans cover every setting. |
| `/final-expense` | Final Expense Life Insurance for Seniors | Simple whole life coverage that pays funeral and end-of-life costs so your family does not have to. No medical exam on most plans, rates locked for life. |
| `/individual-health-aca` | Individual Health Insurance (ACA) Plans Under 65 | Under 65 without employer coverage? ACA marketplace plans are your path, and subsidies often cut the cost sharply. Free help choosing and enrolling. |
| `/book-a-call` | Book a Free Medicare Call — No Pressure, No Cost | Talk with a licensed independent Medicare agent. No cost, no obligation, no sales pressure — just straight answers. Pick a time that works for you. |
| `/presentations` | Free Medicare Seminars in the Lehigh Valley | Free Medicare education sessions at senior centers, libraries and faith communities across the Lehigh Valley — no cost to the venue or attendees. |
| `/quiz` | Find Your Medicare Match — 2-Minute Quiz | Answer a few quick questions and see which Medicare path fits your doctors, medications and budget. No email required to see your results. |
| `/privacy-policy` | Privacy Policy \| Covenant Senior Benefits | How Covenant Senior Benefits collects, uses and protects your personal information. |

## Also in GHL, not in this repo

- **Canonical URLs** — after the `/home` → `/` change, confirm GHL emits `<link rel="canonical">`
  pointing at `/`, not `/home`.
- **301 redirects** — Sites → Redirects. Required for every renamed URL (see `url-plan.md`).
- **Sitemap & robots.txt** — verify GHL is publishing a sitemap and that it lists the new URLs.
- **Google Search Console** — submit the sitemap and watch Coverage for 404s after the renames.
- **Google Business Profile** — the single biggest local-SEO lever for an Allentown agency, and
  entirely outside this site. Without it, the `LocalBusiness` schema has little to anchor to.

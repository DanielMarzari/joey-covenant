#!/usr/bin/env python3
"""Inject JSON-LD structured data and normalise internal URLs across ghl-ready/.

Idempotent: existing SEO blocks are replaced, not duplicated, so this is safe
to re-run after other agents edit the same files.

    python3 seo/apply_seo.py --dry-run     # preview
    python3 seo/apply_seo.py               # write
    python3 seo/apply_seo.py --schema-only # skip URL rewrites
"""
import argparse, html, json, pathlib, re, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import csb_data as S  # noqa: E402

ROOT   = pathlib.Path(__file__).resolve().parent.parent
GHL    = ROOT / "ghl-ready"
MARK_A = "<!-- SEO:JSONLD:START -->"
MARK_B = "<!-- SEO:JSONLD:END -->"
ORG_ID = f"{S.SITE}/#organization"
PER_ID = f"{S.SITE}/#agent"


def _address():
    a = {"@type": "PostalAddress", "addressLocality": S.CITY,
         "addressRegion": S.REGION, "addressCountry": "US"}
    if S.STREET_ADDRESS:
        a["streetAddress"] = S.STREET_ADDRESS
    if S.POSTAL_CODE:
        a["postalCode"] = S.POSTAL_CODE
    return a


def _npn(value):
    return {"@type": "PropertyValue", "name": "National Producer Number",
            "propertyID": "NPN", "value": value}


def _credentials():
    """State producer licence plus any marketplace certifications."""
    creds = []
    if S.RESIDENT_LIC and "PLACEHOLDER" not in S.RESIDENT_LIC:
        creds.append({"@type": "EducationalOccupationalCredential",
                      "credentialCategory": "license",
                      "name": f"{S.REGION_NAME} Resident Insurance Producer License",
                      "identifier": S.RESIDENT_LIC,
                      "recognizedBy": {"@type": "GovernmentOrganization",
                                       "name": S.LIC_AUTHORITY}})
    if getattr(S, "PENNIE_CERTIFIED", False):
        creds.append({"@type": "EducationalOccupationalCredential",
                      "credentialCategory": "certification",
                      "name": "Pennie Certified Broker",
                      "description": ("Certified to enroll consumers in "
                                      "Affordable Care Act marketplace plans "
                                      "through Pennie, Pennsylvania's official "
                                      "health insurance marketplace."),
                      "recognizedBy": {"@type": "GovernmentOrganization",
                                       "name": S.PENNIE_AUTHORITY,
                                       "url": "https://pennie.com"}})
    return creds


def organization():
    org = {
        "@type": ["InsuranceAgency", "LocalBusiness"],
        "@id": ORG_ID,
        "name": S.NAME,
        "url": f"{S.SITE}/",
        "logo": {"@type": "ImageObject", "url": S.LOGO},
        "image": S.LOGO,
        "telephone": S.PHONE,
        "email": S.EMAIL,
        "description": (
            f"Independent Medicare insurance agency based in {S.CITY}, "
            f"{S.REGION_NAME}, serving seniors across {len(S.STATES)} states. "
            "Free, no-obligation guidance on Medicare Advantage, Medicare "
            "Supplement, Part D and supplemental coverage."),
        "address": _address(),
        "areaServed": [{"@type": "State", "name": s} for s in S.STATES],
        "sameAs": S.SAME_AS,
        "employee": {"@id": PER_ID},
        "founder": {"@id": PER_ID},
        "knowsAbout": ["Medicare", "Medicare Advantage", "Medicare Supplement",
                       "Medicare Part D", "Final Expense Insurance",
                       "Hospital Indemnity Insurance"],
        "slogan": "Medicare Made Simple. Guidance You Can Trust.",
    }
    if S.AGENCY_NPN and "PLACEHOLDER" not in S.AGENCY_NPN:
        org["identifier"] = _npn(S.AGENCY_NPN)
    return org


def person():
    p = {"@type": "Person", "@id": PER_ID, "name": S.AGENT,
         "jobTitle": "Licensed Independent Medicare Insurance Agent",
         "worksFor": {"@id": ORG_ID}, "telephone": S.PHONE, "email": S.EMAIL,
         "knowsAbout": ["Medicare", "Medicare Advantage", "Medicare Supplement"],
         "areaServed": [{"@type": "State", "name": s} for s in S.STATES]}
    if S.NPN and "PLACEHOLDER" not in S.NPN:
        p["identifier"] = _npn(S.NPN)
    creds = _credentials()
    if creds:
        p["hasCredential"] = creds
    return p


def breadcrumbs(path, parent, label):
    trail = [("Home", "/")]
    if parent:
        plabel = next((v[2] for v in S.PAGES.values() if v[0] == parent), "Products")
        trail.append((plabel, parent))
    trail.append((label, path))
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i, "name": n,
         "item": f"{S.SITE}{u}"} for i, (n, u) in enumerate(trail, 1)]}


TAG = re.compile(r"<[^>]+>")
FAQ = re.compile(r"<h3[^>]*>\s*([^<]*\?)\s*</h3>\s*<p[^>]*>(.*?)</p>",
                 re.S | re.I)


def faqs(markup):
    out, seen = [], set()
    for q, a in FAQ.findall(markup):
        q = html.unescape(TAG.sub("", q)).strip()
        a = html.unescape(TAG.sub(" ", a))
        a = re.sub(r"\s+", " ", a).strip()
        if len(a) < 40 or q.lower() in seen:
            continue
        seen.add(q.lower())
        out.append({"@type": "Question", "name": q,
                    "acceptedAnswer": {"@type": "Answer", "text": a}})
    return out


def build(stem, markup):
    path, parent, label = S.PAGES[stem]
    graph = []
    if path == "/":
        graph += [organization(), person(),
                  {"@type": "WebSite", "@id": f"{S.SITE}/#website",
                   "url": f"{S.SITE}/", "name": S.NAME,
                   "publisher": {"@id": ORG_ID}}]
    else:
        graph.append({"@type": "Organization", "@id": ORG_ID, "name": S.NAME})
        if stem in getattr(S, "PERSON_PAGES", set()):
            graph.append(person())
        graph.append(breadcrumbs(path, parent, label))
    graph.append({"@type": "WebPage", "@id": f"{S.SITE}{path}#webpage",
                  "url": f"{S.SITE}{path}", "name": label,
                  "isPartOf": {"@id": f"{S.SITE}/#website"},
                  "about": {"@id": ORG_ID},
                  "primaryImageOfPage": {"@type": "ImageObject", "url": S.LOGO}})
    q = faqs(markup) if stem in S.FAQ_PAGES else []
    if len(q) >= 2:
        graph.append({"@type": "FAQPage",
                      "@id": f"{S.SITE}{path}#faq", "mainEntity": q})
    doc = {"@context": "https://schema.org", "@graph": graph}
    body = json.dumps(doc, indent=2, ensure_ascii=False)
    return (f'{MARK_A}\n<script type="application/ld+json">\n'
            f'{body}\n</script>\n{MARK_B}\n'), len(q)


BLOCK = re.compile(re.escape(MARK_A) + r".*?" + re.escape(MARK_B) + r"\n?", re.S)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--schema-only", action="store_true")
    ap.add_argument("--list-faq", action="store_true",
                    help="show every question/answer pair the extractor finds, "
                         "with allowlist status, then exit")
    args = ap.parse_args()

    if args.list_faq:
        for f in sorted(GHL.glob("*.html")):
            q = faqs(f.read_text(encoding="utf-8"))
            if q:
                mark = "IN SCHEMA" if f.stem in S.FAQ_PAGES else "excluded "
                print(f"[{mark}] {f.stem} ({len(q)})")
                for x in q:
                    print(f"      Q: {x['name']}")
        return

    pending = S.unresolved()
    if pending:
        print(f"!  placeholders still unresolved: {', '.join(pending)}")
        print("   (schema is emitted without those fields; re-run after filling in)\n")

    for f in sorted(GHL.glob("*.html")):
        stem, orig = f.stem, f.read_text(encoding="utf-8")
        text, notes = orig, []

        if not args.schema_only:
            n = 0
            for o, w in S.URL_REWRITES.items():
                pat = re.compile(r'href="' + re.escape(o) + r'(["#])')
                text, c = pat.subn(
                    lambda m, w=w: f'href="{w}#' if m.group(1) == "#" else f'href="{w}"',
                    text)
                n += c
            if n:
                notes.append(f"{n} links")

        if stem in S.PAGES:
            block, nq = build(stem, text)
            text = BLOCK.sub("", text)
            i = text.rfind("</div>")
            if i == -1:
                print(f"   skip {f.name}: no closing </div>")
                continue
            text = text[:i] + block + text[i:]
            notes.append("schema" + (f"+{nq} FAQ" if nq >= 2 else ""))

        if text != orig:
            if not args.dry_run:
                f.write_text(text, encoding="utf-8")
            print(f"{'would update' if args.dry_run else 'updated'} {f.name:34s} {', '.join(notes)}")

    print("\ndry run - nothing written" if args.dry_run else "\ndone")


if __name__ == "__main__":
    main()

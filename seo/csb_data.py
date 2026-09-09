"""Single source of truth for Covenant Senior Benefits SEO data.

Edit the PLACEHOLDER values below as the licensing details arrive, then
re-run apply_seo.py -- it is idempotent and safe to run repeatedly.
"""

SITE   = "https://covenantseniorbenefits.com"
NAME   = "Covenant Senior Benefits"
PHONE  = "+1-484-859-8428"
EMAIL  = "joey@covenantseniorbenefits.com"
AGENT  = "Joey Guida"
LOGO   = ("https://assets.cdn.filesafe.space/syjFFgbiNmGuYL7SwVMH"
          "/media/69e644decc4d90735ee45f57.png")

CITY, REGION, REGION_NAME = "Allentown", "PA", "Pennsylvania"

SAME_AS = [
    "https://www.facebook.com/people/65iscomingfast/61572078636697/",
    "https://www.instagram.com/covenantseniorbenefits/",
]

# Sourced from the "Licensed in:" footer added by the licensing agent.
STATES = ["Pennsylvania", "New Jersey", "Delaware", "Virginia", "Ohio",
          "North Carolina", "South Carolina", "Tennessee", "Alabama",
          "Florida", "Louisiana", "Texas", "Arizona"]

# ---- Licensing identifiers ----------------------------------------------
# Three distinct numbers, deliberately kept apart: the agency NPN identifies
# the business entity, the individual NPN and state licence identify Joey.
# They attach to the Organization and the Person nodes respectively.
AGENCY_NPN     = "22186072"   # Covenant Senior Benefits, agency NPN
NPN            = "21431861"   # Joey Guida, individual National Producer Number
RESIDENT_LIC   = "1228636"    # PA resident insurance producer licence
LIC_AUTHORITY  = "Pennsylvania Insurance Department"

# Pennie is Pennsylvania's state-based ACA marketplace (pennie.com), run by the
# PA Health Insurance Exchange Authority. Agents must hold Pennie certification
# to enroll consumers in marketplace plans -- the credential that backs the
# /individual-health-aca page.
PENNIE_CERTIFIED = True
PENNIE_AUTHORITY = "Pennie (Pennsylvania Health Insurance Exchange Authority)"

STREET_ADDRESS = ""   # optional; leave "" to publish city/state only
POSTAL_CODE    = "18104"
# -------------------------------------------------------------------------

def unresolved():
    """Return the fields still awaiting real values."""
    pending = []
    for label, val in (("AGENCY_NPN", AGENCY_NPN), ("NPN", NPN),
                       ("RESIDENT_LIC", RESIDENT_LIC)):
        if not val or "PLACEHOLDER" in val:
            pending.append(label)
    if not POSTAL_CODE:               pending.append("POSTAL_CODE (optional)")
    if not STREET_ADDRESS:            pending.append("STREET_ADDRESS (optional)")
    return pending

# filename stem -> (url path, breadcrumb parent, human label)
PAGES = {
    "home":                   ("/",                     None,         "Home"),
    "products":               ("/products",             None,         "Medicare Plans"),
    "education":              ("/learn",                None,         "Medicare 101"),
    "book-a-call":            ("/book-a-call",          None,         "Book a Call"),
    "book-a-call-A":          ("/book-a-call",          None,         "Book a Call"),
    "presentations":          ("/presentations",        None,         "Presentations"),
    "quiz-A":                 ("/quiz",                 None,         "Medicare Quiz"),
    "privacy-policy":         ("/privacy-policy",       None,         "Privacy Policy"),
    "learn-turning-65":       ("/turning-65",           "/learn",     "Turning 65"),
    "learn-medicare-101":     ("/already-on-medicare",  "/learn",     "Already on Medicare"),
    "leaving-employer-coverage": ("/leaving-employer-coverage", "/learn", "Leaving Employer Coverage"),
    "medicare-part-a":        ("/medicare-part-a",      "/products",  "Medicare Part A"),
    "medicare-part-b":        ("/medicare-part-b",      "/products",  "Medicare Part B"),
    "medicare-part-d":        ("/medicare-part-d",      "/products",  "Medicare Part D"),
    "medicare-advantage":     ("/medicare-advantage",   "/products",  "Medicare Advantage"),
    "medicare-supplement":    ("/medicare-supplement",  "/products",  "Medicare Supplement"),
    "dental-vision-hearing":  ("/dental-vision-hearing","/products",  "Dental, Vision & Hearing"),
    "critical-illness":       ("/critical-illness",     "/products",  "Cancer, Heart & Stroke"),
    "hospital-indemnity":     ("/hospital-indemnity",   "/products",  "Hospital Indemnity"),
    "recovery-care":          ("/recovery-care",        "/products",  "Recovery Care"),
    "final-expense":          ("/final-expense",        "/products",  "Final Expense"),
    "individual-health-aca":  ("/individual-health-aca","/products",  "Individual Health (ACA)"),
}

# Sitewide link rewrites: old href -> new href
URL_REWRITES = {
    "/home":               "/",
    "/education-page":     "/learn",
    "/learn-turning-65":   "/turning-65",
    "/learn-medicare-101": "/already-on-medicare",
}

# Pages whose <h3>?</h3><p></p> pairs are GENUINE question/answer content and
# may be marked up as FAQPage. Everything else on the site uses that markup for
# CTA cards or UI help text -- marking those up would be misleading structured
# data and risks a Google manual action. Add a page here only after checking
# that every extracted pair reads as a real question with a real answer:
#     python3 seo/apply_seo.py --list-faq
FAQ_PAGES = {"learn-medicare-101", "leaving-employer-coverage"}

# Pages that carry the full Person node inline rather than only an @id
# reference to it. Home always does. Add a page here when the agent's
# credentials are material to that page's topic -- the ACA page rests on the
# Pennie certification, and search engines do not reliably resolve @id
# references across pages.
PERSON_PAGES = {"individual-health-aca"}

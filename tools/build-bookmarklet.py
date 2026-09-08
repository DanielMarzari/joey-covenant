"""Build the CSB → GHL sync bookmarklet from tools/bookmarklet-src.js.

Minifies the JS (strips block/line comments and collapses whitespace),
URL-encodes it, and prepends `javascript:`. Prints the ready-to-paste
bookmarklet URL and also writes it to tools/bookmarklet.txt.

Usage:
  python3 tools/build-bookmarklet.py
"""
import re
import os
from urllib.parse import quote

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'bookmarklet-src.js')
OUT = os.path.join(HERE, 'bookmarklet.txt')

with open(SRC, 'r') as f:
    js = f.read()

# 1) Strip block comments /* ... */
js = re.sub(r'/\*.*?\*/', '', js, flags=re.DOTALL)

# 2) Strip line comments // ...  (only when not inside a string — good enough
# heuristic: line-anchored //, ignoring http:// and https://).
def strip_line_comments(line):
    # Skip if it looks like a URL fragment
    m = re.search(r'(?<![:\'"])//', line)
    if not m:
        return line
    return line[:m.start()].rstrip()

js = '\n'.join(strip_line_comments(line) for line in js.split('\n'))

# 3) Collapse runs of whitespace to a single space, but keep semicolons/braces
js = re.sub(r'\s+', ' ', js).strip()

# 4) Wrap: bookmarklet must not return a truthy value or the browser navigates
# to it. The source is already an IIFE returning undefined, so this is safe,
# but add a trailing void 0 as belt-and-suspenders.
js = js + ';void 0;'

# 5) URL-encode (percent-encode everything the browser wants escaped).
# safe='' means encode even `/`, `?`, `#` etc. that could confuse the URL parser.
encoded = quote(js, safe='')

bookmarklet = 'javascript:' + encoded

with open(OUT, 'w') as f:
    f.write(bookmarklet)

print(f"Wrote: {OUT}")
print(f"Bookmarklet length: {len(bookmarklet)} chars")
print()
print("── Copy the whole line below and paste it as the URL of a new bookmark ──")
print()
print(bookmarklet)

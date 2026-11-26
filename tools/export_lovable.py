#!/usr/bin/env python3
"""Exports the RASA World website (V1, V2, V3 and the inner pages, nothing else) as a Lovable-ready Vite + React project.

Usage, from the repo root:  python3 tools/export_lovable.py <output folder>
The output folder gets the shell from lovable/ and the site in public/, keeping only the assets the site uses
(the early design concepts, their recordings and the hub page stay out). An existing .git in the folder is kept,
so the export can be committed and pushed to the Lovable-linked repo.
"""
import glob, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else sys.exit(__doc__)
HOMES = ['site.html', 'site-v2.html', 'site-v3.html']

os.makedirs(out, exist_ok=True)
for name in os.listdir(out):                       # clear everything but the repo's history
    if name != '.git' and name != 'node_modules':
        p = os.path.join(out, name)
        shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
shutil.copytree(os.path.join(ROOT, 'lovable'), out, dirs_exist_ok=True)
pub = os.path.join(out, 'public')
os.makedirs(pub)
for h in HOMES:
    shutil.copy(os.path.join(ROOT, h), pub)
shutil.copytree(os.path.join(ROOT, 'pages'), os.path.join(pub, 'pages'))

# the assets the pages reference (links, scripts, the import map, css url()s), the three.js build and the fonts
used = set()
for f in [os.path.join(pub, h) for h in HOMES] + glob.glob(os.path.join(pub, 'pages', '*.html')):
    s = open(f).read()
    for m in re.findall(r'''(?:src|href)="((?!https?:|mailto:|#|//)[^"?#]+)''', s):
        used.add(os.path.normpath(os.path.join(os.path.dirname(f), m)))
    for m in re.findall(r'"\./assets/([^"]+)"', s):
        used.add(os.path.join(pub, 'assets', m))
for f in [u for u in used if u.endswith('.css')]:
    rel = os.path.relpath(f, pub)
    src = os.path.join(ROOT, rel)
    for m in re.findall(r'url\(([^)]+)\)', open(src).read()):
        m = m.strip('\'"')
        if not m.startswith(('http', 'data:', '#')):
            used.add(os.path.normpath(os.path.join(os.path.dirname(f), m.split('?')[0])))
keep = {os.path.relpath(u, pub) for u in used if os.path.relpath(u, pub).startswith('assets')}
keep |= {os.path.relpath(p, ROOT) for p in glob.glob(os.path.join(ROOT, 'assets', 'vendor', 'three', '**', '*'), recursive=True) if os.path.isfile(p)}
keep |= {os.path.relpath(p, ROOT) for p in glob.glob(os.path.join(ROOT, 'assets', 'fonts-web', '*')) if os.path.isfile(p)}
keep.add('assets/rasa-logo.svg')                    # drawn by burst.js
missing = []
for rel in sorted(keep):
    src = os.path.join(ROOT, rel)
    if os.path.isfile(src):
        os.makedirs(os.path.join(pub, os.path.dirname(rel)), exist_ok=True)
        shutil.copy(src, os.path.join(pub, rel))
    else:
        missing.append(rel)
print(f'exported {len(HOMES)} homepages, {len(os.listdir(os.path.join(pub, "pages")))} inner pages, {len(keep) - len(missing)} assets to {out}')
if missing:
    print('missing:', missing)

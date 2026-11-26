#!/usr/bin/env python3
"""Builds RASA World's inner pages (pages/*.html) in the Prism design from rasaworld.com's content.

Source: docs/rasaworld-pages-2026-11-18.json, a structured capture of every rasaworld.com page made with
tools/crawl-rasaworld.cjs (each page as ordered blocks: headings, text, lists, images, videos, links, form fields and
groups of repeated cards). Images and videos stay hotlinked from rasaworld.com, as on the home page.

Run from the repo root:  python3 tools/build_pages.py
Case studies, press articles, the brief form, contact and the calendar have their own layouts; every other page is
laid out section by section from its blocks.
"""
import html, json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = json.load(open(ROOT / 'docs/rasaworld-pages-2026-11-18.json'))
OUT = ROOT / 'pages'
OUT.mkdir(exist_ok=True)
R = 'https://rasaworld.com'
e = lambda s: html.escape(s or '', quote=True)
AR = '<svg class="ar" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4.2 3H9v4.8"/></svg>'

# ------------------------------------------------------------------ links: rasaworld.com paths -> this site
PAGE = {'/atelier': 'atelier', '/Tabulah': 'tabulah', '/tabulah': 'tabulah', '/services': 'services', '/services-legacy': 'services',
        '/brand-leaders': 'brand-leaders', '/agency-and-teams': 'agency-and-teams', '/About-Us': 'our-story', '/our-story': 'our-story',
        '/our-values': 'our-values', '/case-studies': 'case-studies', '/insights/case-studies': 'case-studies', '/press': 'press',
        '/blog': 'blog', '/contact': 'contact', '/event-calendar': 'event-calendar', '/start-your-event': 'start-your-event',
        '/terms': 'terms', '/privacy': 'terms'}


def link(h):
    if not h:
        return ''
    if h.startswith(('http', 'mailto:', 'tel:')):
        if h.startswith(R):
            h = h[len(R):] or '/'
        else:
            return h
    if h in ('/', '/ecosystem'):
        return '../site.html'
    if h == '#rasa-experiences':
        return '../site.html#universes'
    if h.startswith('#'):
        return h
    p = h.split('#')[0].split('?')[0]
    frag = '#' + h.split('#')[1] if '#' in h else ''
    if p in PAGE:
        return PAGE[p] + '.html' + frag
    for pre, name in (('/case-study/', 'case-'), ('/press/', 'press-'), ('/blog/', 'blog-')):
        if p.startswith(pre):
            return name + p[len(pre):] + '.html'
    return R + h


def ext(h):
    return h.startswith('http') and not h.startswith(R)


def a_attr(h):
    l = link(h)
    return f'href="{e(l)}"' + (' target="_blank" rel="noopener"' if ext(l) else '')


# ------------------------------------------------------------------ shared page shell
NAV = [('atelier.html', 'Atelier'), ('tabulah.html', 'Tabulah'), ('case-studies.html', 'Case studies'), ('our-story.html', 'About'),
       ('press.html', 'Press'), ('event-calendar.html', 'Calendar')]
FOOT = [
    ('What we do', [('../site.html', 'RASA World home'), ('atelier.html', 'Our corporate events: Atelier by RASA'), ('tabulah.html', 'Event technology'), ('../site.html#universes', 'Our ecosystem & IPs')]),
    ('Who we serve', [('brand-leaders.html', 'Brand leaders'), ('agency-and-teams.html', 'Agencies & teams')]),
    ('About', [('our-story.html', 'Our story'), ('our-values.html', 'Our values'), ('services.html', 'Corporate services')]),
    ('Insights', [('case-studies.html', 'Case studies'), ('blog.html', 'Blog'), ('blog-ultimate-guide-to-experiential-marketing.html', 'Experiential marketing guide'), ('press.html', 'Press')]),
    ('Event calendar', [('event-calendar.html', 'Event calendar')]),
    ('Get in touch', [('contact.html', 'Contact'), ('start-your-event.html', 'Start your event brief'), ('https://www.rasa.fyi/events', 'Attend our community events ↗'), ('https://www.instagram.com/rasa.us/', 'Instagram ↗'), ('https://www.linkedin.com/company/rasa-group-us/', 'LinkedIn ↗')]),
]


def shell(slug, title, desc, body, cur=''):
    nav = ''.join(f'<a href="{h}"{" aria-current=\"page\"" if h == cur else ""}>{t}</a>' for h, t in NAV)
    mnav = ''.join(f'<a style="--i:{i}" href="{h}">{t}</a>' for i, (h, t) in enumerate([('../site.html', 'Home')] + NAV))
    cols = ''.join('<div><p class="fk">%s</p>%s</div>' % (e(k), ''.join(f'<a {a_attr(h) if h.startswith("http") else f"href=\"{h}\""}>{e(t)}</a>' for h, t in v)) for k, v in FOOT)
    return f'''<!doctype html>
<html lang="en" class="v3 v5 v6 site inner">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<!-- Built by tools/build_pages.py from rasaworld.com's content ({slug}). Edit the builder, not this file. -->
<link rel="preconnect" href="https://rasaworld.com">
<link rel="stylesheet" href="../assets/fonts-web/fonts.css">
<link rel="stylesheet" href="../assets/css/rasa2.css?r=11">
<link rel="stylesheet" href="../assets/css/rasa3.css?r=11">
<link rel="stylesheet" href="../assets/css/rasa5.css?r=11">
<link rel="stylesheet" href="../assets/css/rasa6.css?r=11">
<link rel="stylesheet" href="../assets/css/site.css?r=13">
<link rel="stylesheet" href="../assets/css/pages.css?r=5">
</head>
<body>
<div class="pg-room" aria-hidden="true"><i></i><i></i><i></i></div>
<div class="grain" aria-hidden="true"></div>
<header class="site-header" data-scrolled>
  <div class="nbar">
    <a class="brand" href="../site.html" aria-label="RASA World home"><span class="logo" aria-hidden="true"></span></a>
    <nav class="d-nav" aria-label="Pages">{nav}</nav>
    <a class="pill-cta d-cta" href="start-your-event.html">Start your brief {AR}</a>
    <button class="burger-btn" type="button" aria-expanded="false" aria-controls="m-nav" aria-label="Open menu"><span class="burger"><i></i><i></i></span></button>
    <nav class="m-nav" id="m-nav" aria-label="Menu">{mnav}<p style="--i:7" class="m-ev">Nights of Wonder · Transamerica Pyramid · Dec 10–27</p><a style="--i:8" class="pill-cta" href="start-your-event.html">Start your brief {AR}</a></nav>
  </div>
</header>
<main id="top" class="pg pg-{slug}">
{body}
</main>
<footer class="foot">
  <div class="wrap">
    <div class="foot-top">
      <div class="foot-brand"><span class="lockup" role="img" aria-label="Atelier by RASA"><span class="lk-a">Atelier</span><span class="lk-by">by</span><span class="logo lk-logo"></span></span><p class="foot-atelier">Powering legendary events at the world's most memorable brands.</p></div>
      <form class="news" data-form="newsletter">
        <label for="nl">Newsletter: first access to case studies of legendary events</label>
        <div class="news-row"><input id="nl" name="email" type="email" placeholder="Your email" required><button type="submit">Opt in</button></div>
        <p class="news-ok">Thanks. You're on the list.</p>
      </form>
    </div>
    <div class="foot-cols pg-foot-cols">{cols}</div>
    <div class="foot-base"><span>© 2026 Atelier by RASA · Crafted in Los Angeles, connected worldwide</span><span><a href="terms.html#privacy">Privacy</a> · <a href="terms.html">Terms</a></span></div>
  </div>
</footer>
<script src="../assets/vendor/lenis/lenis.min.js"></script>
<script src="../assets/js/content.js?r=11"></script>
<script src="../assets/js/pages.js?r=2"></script>
<script src="../assets/js/forms.js?r=1"></script>
</body>
</html>
'''


# ------------------------------------------------------------------ block helpers
VAL = re.compile(r'^[~+\-]?[$€£]?\d[\d.,]*\s?[KMBkx%]?\+?%?x?$|^\d+(\.\d+)?x$')
JUNK = re.compile(r'^(SKIP TO CONTENT|RSVP|MONUMENTS ·.*|NIGHTS OF WONDER.*|·|Back to .*|Atelier|by)$', re.I)
EMOJI = re.compile(r'^[\U0001F300-\U0001FAFF☀-➿]+$')


def txt(b):
    return b.get('t') or b.get('p') or b.get('s') or b.get('li') or b.get('a') or ''


def is_eyebrow(b):
    t = b.get('p') or b.get('s')
    return bool(t) and len(t) <= 48 and t.upper() == t and not VAL.match(t) and not EMOJI.match(t)


def clean(blocks):
    out = []
    for b in blocks:
        t = txt(b)
        if (b.get('a') or b.get('s') or b.get('p')) and JUNK.match(t.strip()):
            continue
        out.append(b)
    return out


def sections(blocks):
    """Split blocks into sections: an eyebrow + heading (h1-h2, or h3 right after an eyebrow) starts one."""
    secs, cur = [], None
    i = 0
    while i < len(blocks):
        b = blocks[i]
        nxt = blocks[i + 1] if i + 1 < len(blocks) else {}
        if is_eyebrow(b) and 'h' in nxt and nxt['h'] <= 3:
            cur = {'eb': b.get('p') or b.get('s'), 'h': nxt['t'], 'lv': nxt['h'], 'items': []}
            secs.append(cur); i += 2; continue
        if 'h' in b and b['h'] <= 2 and b['t'].strip():
            cur = {'eb': '', 'h': b['t'], 'lv': b['h'], 'items': []}
            secs.append(cur); i += 1; continue
        if cur is None:
            cur = {'eb': '', 'h': '', 'lv': 2, 'items': []}; secs.append(cur)
        cur['items'].append(b); i += 1
    return secs


NAMES = ['RASA', 'Santa Monica Pier', 'Bob Hope Patriotic Hall', 'Wet Deck', 'Atelier', 'Tabulah', 'Google', 'Delta', 'L.A. Comic Con', 'L.A.', 'LA', 'Comic Con', 'Six Flags', 'Magic Mountain', 'Santa Monica', 'Pier Play',
         'Thrill City', 'THRILL CITY', 'Portalverse', 'Monuments', 'Hawkefest', 'H. Lorenzo', 'Mowalola', 'Miss Sixty', 'Honey Birdette', 'Playboy', 'Rivian',
         'Frieze', 'Aston Martin', 'Galpin', 'ClickUp', 'Miami', 'Los Angeles', 'Mountain View', 'Fashion Week', 'Tech Week', 'Club Honey',
         'Endless Summer Festival', 'Visitor Experience', 'Renaissance', 'W Hotel', 'Hollywood', 'Nightingale', 'Veuve Clicquot', 'Eiffel Tower',
         'Palace of Fine Arts', 'Transamerica Pyramid', 'San Francisco', 'London', 'Art Basel', 'SXSW', 'Formula One', 'AI', 'CRM', 'ROI', 'VIP', 'KPIs', 'IPs', 'I']


def sentence(t):
    """rasaworld.com sets many headings in capitals; the Prism design uses sentence case. Brand names keep theirs."""
    if not t or t.upper() != t or not re.search('[A-Z]{3}', t):
        return t
    out = t.lower()
    out = re.sub(r'(^|[.!?]\s+|\n)([a-z])', lambda m: m.group(1) + m.group(2).upper(), out)
    for n in sorted(NAMES, key=len, reverse=True):
        out = re.sub(r'(?<![\w])' + re.escape(n.lower()) + r'(?![\w])', n if n != 'THRILL CITY' else 'Thrill City', out, flags=re.I)
    return out


def heading(t, tag='h2', cls='pg-h2'):
    t = sentence(t)
    parts = [p.strip() for p in t.split('\n') if p.strip()]
    if len(parts) > 1:
        inner = '<br>'.join(e(p) if k < len(parts) - 1 else f'<span class="acc">{e(p)}</span>' for k, p in enumerate(parts))
    else:
        w = e(t).split(' ')
        inner = ' '.join(w[:-2] + [f'<span class="acc">{" ".join(w[-2:])}</span>']) if len(w) > 3 else e(t)
    return f'<{tag} class="{cls}">{inner}</{tag}>'


def btns(items):
    out = []
    for k, b in enumerate(items):
        t = b['a'].rstrip(' →').strip()
        cls = 'pill-cta' if k == 0 else 'cta-ghost'
        out.append(f'<a class="{cls}" {a_attr(b.get("href", ""))}>{e(t)} {AR}</a>')
    return f'<div class="pg-btns">{"".join(out)}</div>'


def logos_strip():
    return '<div class="pg-logos" data-logos-wall></div>'


def card_html(c, kind):
    lines, seen = [], set()
    for l in c['text'].split('\n'):
        k = l.strip().lower()
        if k and k not in ('•', '·', '-') and k not in seen and k != (c['title'] or '').strip().lower():
            seen.add(k); lines.append(l.strip())
    if kind == 'img' and not c['img']:
        kind = 'txt'                               # a card without a picture in a picture grid reads as a text card
    href = c.get('href')
    tag, attr = ('a', a_attr(href)) if href and href not in ('/services',) or (href and kind == 'img') else ('div', '')
    if kind == 'img':
        loc = lines[0] if lines and len(lines[0]) < 70 else ''
        rest = lines[1:] if loc else lines
        media = (f'<video src="{e(c["img"])}" muted loop playsinline autoplay preload="metadata"></video>' if c['img'].endswith(('.mp4', '.webm'))
                 else f'<img src="{e(c["img"])}" alt="{e(c["title"] or loc)}" loading="lazy">')
        body = (f'<p class="pg-k">{e(loc)}</p>' if loc else '') + (f'<h3 class="pg-ct">{e(sentence(c["title"]))}</h3>' if c['title'] else '')
        body += ''.join(f'<p class="pg-cd">{e(l)}</p>' for l in rest[:4])
        return f'<{tag} class="pg-card pg-icard" {attr}><span class="pg-ph">{media}</span><span class="pg-cb">{body}{("<span class=\"pg-go\">" + AR + "</span>") if tag == "a" else ""}</span></{tag}>'
    # text card: a short first line (a number, or an uppercase label) becomes its eyebrow
    eb = ''
    if lines and (len(lines[0]) <= 40 and (lines[0].upper() == lines[0] or VAL.match(lines[0]) or lines[0].startswith('$'))):
        eb = lines.pop(0)
    sub = ''
    if lines and len(lines[0]) <= 60 and (lines[0].upper() == lines[0] or lines[0].startswith('$') or lines[0].lower().startswith('custom')):
        sub = lines.pop(0)
    body = (f'<p class="pg-k">{e(eb)}</p>' if eb else '') + (f'<h3 class="pg-ct">{e(sentence(c["title"]))}</h3>' if c['title'] else '')
    body += (f'<p class="pg-sub">{e(sub)}</p>' if sub else '') + ''.join(f'<p class="pg-cd">{e(l)}</p>' for l in lines)
    go = f'<span class="pg-go">{AR}</span>' if tag == 'a' else ''
    return f'<{tag} class="pg-card pg-tcard" {attr}>{body}{go}</{tag}>'


def cards(cs):
    if all(not c['title'] and not c['text'].strip() for c in cs):
        if len(cs) <= 3:                        # marquee rows of brand logos
            return logos_strip()
        imgs = [c for c in cs if c['img']]
        return '<div class="pg-wall">' + ''.join(f'<figure><img src="{e(c["img"])}" alt="" loading="lazy"></figure>' for c in imgs) + '</div>'
    if all(not c['title'] and c['img'] for c in cs):  # photo wall with captions
        return '<div class="pg-wall">' + ''.join(f'<figure><img src="{e(c["img"])}" alt="{e(c["text"].splitlines()[0] if c["text"] else "")}" loading="lazy"><figcaption>{e(c["text"].splitlines()[0] if c["text"] else "")}</figcaption></figure>' for c in cs) + '</div>'
    kind = 'img' if sum(1 for c in cs if c['img']) >= len(cs) / 2 else 'txt'
    n = len(cs)
    cols = 'c2' if n in (2, 4) else 'c3'
    return f'<div class="pg-grid {cols} {"pg-igrid" if kind == "img" else ""}">' + ''.join(card_html(c, kind) for c in cs) + '</div>'


def stats_and_rest(run):
    """A run of short text blocks: value/label pairs become figures, label/value pairs become feature rows, others chips."""
    run = [b for b in run if not EMOJI.match(txt(b))]
    out, i, chips, rows = [], 0, [], []
    stats = []
    while i < len(run):
        a = txt(run[i]); b = txt(run[i + 1]) if i + 1 < len(run) else None
        if VAL.match(a) and b and not VAL.match(b):
            stats.append((a, b)); i += 2; continue
        if b and VAL.match(b) and not VAL.match(a) and a.upper() == a:
            stats.append((b, a)); i += 2; continue
        if b and b in ('Yours to keep', 'Real-time', 'Every event') and not VAL.match(a):
            rows.append((a, b)); i += 2; continue
        chips.append(a); i += 1
    if stats:
        out.append('<div class="pg-stats">' + ''.join(f'<div class="pg-stat"><b>{e(v)}</b><span>{e(l)}</span></div>' for v, l in stats) + '</div>')
    if rows:
        out.append('<dl class="pg-rows">' + ''.join(f'<div><dt>{e(a)}</dt><dd>{e(b)}</dd></div>' for a, b in rows) + '</dl>')
    if chips:
        out.append('<ul class="pg-chips">' + ''.join(f'<li>{e(c)}</li>' for c in chips) + '</ul>')
    return out


def compare_table(run):
    """Atelier's comparison: 'Attribute' + 4 column heads, then rows of name, note, 4 answers; then the legend."""
    t = [txt(b) for b in run]
    i = t.index('Attribute')
    heads = t[i:i + 5]; i += 5
    rows = []
    while i + 5 < len(t) and t[i] not in ('Yes', '= fully delivers'):
        name, note, vals = t[i], t[i + 1], t[i + 2:i + 6]
        if not all(v.split(' ')[0] in ('Yes', 'No', 'Limited') for v in vals):
            break
        rows.append((name, note, vals)); i += 6
    mark = lambda v: f'<span class="pg-m {v.split(" ")[0].lower()}">{e(v)}</span>'
    th = ''.join(f'<th scope="col">{e(h)}</th>' for h in heads)
    tr = ''.join(f'<tr><th scope="row"><b>{e(n)}</b><small>{e(no)}</small></th>' + ''.join(f'<td>{mark(v)}</td>' for v in vs) + '</tr>' for n, no, vs in rows)
    return f'<div class="pg-table-wrap"><table class="pg-table"><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div><p class="pg-legend"><span class="pg-m yes">Yes</span> fully delivers · <span class="pg-m limited">Limited</span> partial capability · <span class="pg-m no">No</span> not offered</p>'


def render_items(items):
    out, i = [], 0
    while i < len(items):
        b = items[i]
        k = next(x for x in ('h', 'p', 'li', 's', 'a', 'cards', 'img', 'video', 'field', 'btn') if x in b)
        j = i + 1
        same = lambda x: k in x and not ('h' in x)
        while j < len(items) and same(items[j]):
            j += 1
        run = items[i:j]
        if k == 'h':
            out.append(f'<h3 class="pg-h3">{e(sentence(b["t"]))}</h3>') if b['t'].strip() else None
        elif k == 'p':
            out.append('<div class="pg-prose">' + ''.join((f'<p class="pg-k">{e(x["p"])}</p>' if x['p'].upper() == x['p'] and len(x['p']) < 60 else f'<p>{e(x["p"])}</p>') for x in run) + '</div>')
        elif k == 'li':
            if all(len(x['li']) <= 40 for x in run):
                out.append('<ul class="pg-chips">' + ''.join(f'<li>{e(x["li"])}</li>' for x in run) + '</ul>')
            else:
                out.append('<ol class="pg-list">' + ''.join(f'<li><span>{n + 1:02d}</span><p>{e(x["li"])}</p></li>' for n, x in enumerate(run)) + '</ol>')
        elif k == 's':
            # gather a mixed run of short text (s) and short paragraphs (p) for figures like "130K+ / Happy guests"
            j = i
            while j < len(items) and (('s' in items[j]) or ('p' in items[j] and len(items[j]['p']) < 70) or ('a' in items[j] and 'Technology Platform' in items[j]['a'])):
                j += 1
            run = items[i:j]
            if any(txt(x) == 'Attribute' for x in run):
                out.append(compare_table([x if 'a' not in x else {'s': x['a']} for x in run]))
            else:
                out.extend(stats_and_rest(run))
        elif k == 'a':
            out.append(btns(run))
        elif k == 'cards':
            out.append(cards(b['cards']))
        elif k == 'img':
            if len(run) >= 3:
                out.append('<div class="pg-wall">' + ''.join(f'<figure><img src="{e(x["img"])}" alt="{e(x.get("alt"))}" loading="lazy"></figure>' for x in run) + '</div>')
            else:
                out.extend(f'<figure class="pg-media"><img src="{e(x["img"])}" alt="{e(x.get("alt"))}" loading="lazy"></figure>' for x in run)
        elif k == 'video':
            out.extend(f'<figure class="pg-media"><video src="{e(x["video"])}" muted loop playsinline autoplay preload="metadata"></video></figure>' for x in run if x['video'])
        i = j
    return '\n'.join(x for x in out if x)


def generic(blocks, hero_cls=''):
    secs = sections(clean(blocks))
    out = []
    for n, s in enumerate(secs):
        if not s['h'] and not s['items']:
            continue
        if n == 0:
            out.append(f'<section class="pg-hero {hero_cls}"><div class="wrap">' + (f'<p class="eyebrow">{e(s["eb"])}</p>' if s['eb'] else '')
                       + heading(s['h'], 'h1', 'pg-h1') + render_items(s['items']) + '</div></section>')
        else:
            out.append('<section class="pg-sec" data-rv><div class="wrap">' + (f'<p class="eyebrow">{e(s["eb"])}</p>' if s['eb'] else '')
                       + (heading(s['h']) if s['h'] else '') + render_items(s['items']) + '</div></section>')
    return '\n'.join(out)


def cta_band(h='Tell us the outcome. We\'ll design the night.', p='Start your event brief and we\'ll be in touch. No retainer, no commitment, just a partner who gets it.'):
    return f'''<section class="pg-band" data-rv><div class="wrap"><p class="eyebrow">Start here</p>{heading(h)}<p class="pg-lede">{e(p)}</p>
<div class="pg-btns"><a class="pill-cta" href="start-your-event.html">Start your event brief {AR}</a><a class="cta-ghost" href="case-studies.html">See the work {AR}</a></div></div></section>'''


# ------------------------------------------------------------------ case studies
def case_page(slug, d):
    b = clean(d['blocks'])
    t = [txt(x) for x in b]
    meta = {}
    for key in ('CLIENT', 'LOCATION', 'AUDIENCE', 'SCOPE'):
        if key in t:
            k = len(t) - 1 - t[::-1].index(key) if key in ('AUDIENCE', 'SCOPE') else t.index(key)
            meta[key.title()] = t[k + 1]
    h = next(x for x in b if x.get('h') == 1 or ('h' in x and x['t'] not in ('OVERVIEW',)))
    hi = b.index(h)
    sub = b[hi + 1].get('p', '') if hi + 1 < len(b) else ''
    def between(a, z):
        ia = next((k for k, x in enumerate(b) if x.get('t') == a), None)
        if ia is None:
            return []
        iz = next((k for k, x in enumerate(b) if k > ia and ('h' in x or (x.get('s') in ('AUDIENCE', 'SCOPE', 'NEXT CASE')))), len(b))
        return b[ia + 1:iz]
    over = between('OVERVIEW', 'HIGHLIGHTS')
    paras = [x['p'] for x in over if 'p' in x]
    vids = [x['video'] for x in b if x.get('video')]
    imgs = [x['img'] for x in b if x.get('img') and 'Image' in (x.get('alt') or '')]
    high = [x['li'] for x in between('HIGHLIGHTS', '') if 'li' in x]
    imp = [x['li'] for x in between('IMPACT', '') if 'li' in x]
    # extra headed blocks some cases carry (e.g. "RESULTS", "THE EXPERIENCE")
    nk = next((k for k, x in enumerate(b) if x.get('s') == 'NEXT CASE'), None)
    nxt = None
    if nk is not None:
        nh = next((x for x in b[nk:] if 'h' in x), None); ni = next((x for x in b[nk:] if x.get('img')), None)
        nxt = (nh['t'] if nh else '', ni['img'] if ni else '')
    hero_img = imgs[0] if imgs else ''
    loc = meta.get('Location', '')
    meta_html = ''.join(f'<div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>' for k, v in meta.items())
    gallery = imgs[1:]
    body = f'''<section class="pg-hero pg-case-hero"><div class="wrap">
<a class="pg-back" href="case-studies.html">← All case studies</a>
<p class="eyebrow">Case study{(' · ' + e(loc)) if loc else ''}</p>
{heading(h['t'], 'h1', 'pg-h1')}
<p class="pg-lede">{e(sub)}</p></div>
{f'<figure class="pg-cover"><img src="{e(hero_img)}" alt="{e(h["t"])}"></figure>' if hero_img else ''}
</section>
<section class="pg-sec" data-rv><div class="wrap pg-split"><div><p class="eyebrow">Overview</p><dl class="pg-meta">{meta_html}</dl></div>
<div class="pg-prose pg-prose-l">{''.join(f'<p>{e(p)}</p>' for p in paras)}</div></div></section>
{''.join(f'<section class="pg-sec pg-film" data-rv><div class="wrap"><figure class="pg-media"><video src="{e(v)}" muted loop playsinline autoplay preload="metadata" controls></video></figure></div></section>' for v in vids)}
{f'<section class="pg-sec" data-rv><div class="wrap"><p class="eyebrow">Highlights</p>{heading("What we delivered")}<ol class="pg-list">' + "".join(f"<li><span>{n + 1:02d}</span><p>{e(x)}</p></li>" for n, x in enumerate(high)) + '</ol></div></section>' if high else ''}
{f'<section class="pg-sec" data-rv><div class="wrap"><p class="eyebrow">Gallery</p><div class="pg-wall pg-gal">' + "".join(f'<figure><img src="{e(x)}" alt="{e(h["t"])}" loading="lazy"></figure>' for x in gallery) + '</div></div></section>' if gallery else ''}
{f'<section class="pg-sec" data-rv><div class="wrap"><p class="eyebrow">Impact</p>{heading("What it changed")}<ol class="pg-list pg-impact">' + "".join(f"<li><span>{n + 1:02d}</span><p>{e(x)}</p></li>" for n, x in enumerate(imp)) + '</ol></div></section>' if imp else ''}
'''
    if nxt:
        # find the slug of the next case by title
        ns = next((s for s, v in CASES.items() if v['title'].lower() == nxt[0].lower()), None)
        body += f'''<section class="pg-sec pg-next" data-rv><div class="wrap"><p class="eyebrow">Next case</p>
<a class="pg-card pg-icard pg-next-card" href="{('case-' + ns + '.html') if ns else 'case-studies.html'}"><span class="pg-ph"><img src="{e(nxt[1])}" alt="" loading="lazy"></span><span class="pg-cb"><h3 class="pg-ct">{e(nxt[0])}</h3><span class="pg-go">{AR}</span></span></a></div></section>'''
    body += cta_band()
    return body


CASES = {}
for r, d in SRC.items():
    if r.startswith('/case-study/'):
        h = next((x for x in d['blocks'] if 'h' in x), {'t': ''})
        CASES[r.split('/')[-1]] = {'title': h['t'], 'd': d}


# ------------------------------------------------------------------ press
def press_page(slug, d):
    b = clean(d['blocks'])
    h = next(x for x in b if 'h' in x)
    hi = b.index(h)
    eb = next((x.get('p') or x.get('s') for x in b[:hi] if (x.get('p') or x.get('s'))), 'Press')
    meta = [txt(x) for x in b[hi + 1:hi + 4] if x.get('s')]
    end = next((k for k, x in enumerate(b) if txt(x).startswith('KEEP EXPLORING')), len(b))
    flow = []
    orig = ''
    for x in b[hi + 1:end]:
        if x.get('s') in meta:
            continue
        if x.get('p') and x['p'].startswith('Original article'):
            continue
        if x.get('a') and x.get('href', '').startswith('http'):
            orig = x['href']; continue
        if x.get('img'):
            flow.append(f'<figure class="pg-media"><img src="{e(x["img"])}" alt="{e(x.get("alt"))}" loading="lazy"></figure>')
        elif x.get('p'):
            flow.append(f'<p>{e(x["p"])}</p>')
        elif 'h' in x:
            flow.append(f'<h3 class="pg-h3">{e(x["t"])}</h3>')
        elif x.get('li'):
            flow.append(f'<p class="pg-li">{e(x["li"])}</p>')
    src = f'<p class="pg-orig">Original article: <a href="{e(orig)}" target="_blank" rel="noopener">{e(re.sub(r"^https?://(www\.)?", "", orig).split("/")[0])} ↗</a></p>' if orig else ''
    return f'''<section class="pg-hero pg-article-hero"><div class="wrap pg-narrow">
<a class="pg-back" href="press.html">← All press</a>
<p class="eyebrow">{e(eb)}</p>{heading(h['t'], 'h1', 'pg-h1 pg-h1-s')}
<p class="pg-byline">{' · '.join(e(m) for m in meta)}</p></div></section>
<section class="pg-sec pg-article" data-rv><div class="wrap pg-narrow pg-prose pg-prose-l">{''.join(flow)}{src}</div></section>
{cta_band('Bring your next event to life', 'Connect with our team to learn more about how we can power your next event and make it legendary.')}'''


# ------------------------------------------------------------------ brief form and contact
SERVICES = ['Full-service event production services', 'Sponsorship or activation at Rasa event', 'Strategy & creative direction', 'Venue sourcing',
            'Tastemaker invites', 'Talent curation', 'Production & logistics', 'Media & content recording or production', 'Staffing',
            'Audience engagement & ticketing platform']


def brief_page(d):
    b = clean(d['blocks'])
    cases = [(x['a'], x['href']) for x in b if x.get('a') and x.get('href', '').startswith('/case-study/')]
    proof = next(k for k, x in enumerate(b) if txt(x) == 'NEED MORE PROOF?')
    rest = generic(b[proof:])
    chips = ''.join(f'<label class="pg-check"><input type="checkbox" name="services" value="{e(s)}"><span>{e(s)}</span></label>' for s in SERVICES)
    return f'''<section class="pg-hero pg-brief-hero"><div class="wrap pg-split pg-split-top">
<div><p class="eyebrow">Start your event</p>{heading('Build your event brief', 'h1', 'pg-h1')}
<p class="pg-lede">From a single activation to a full production, you get our creative playbook, production expertise, and technology, all in one place.</p>
<p class="pg-k pg-mt">Join the world's most ambitious brands. See what's possible in their case studies:</p>
<ul class="pg-chips pg-chips-a">{''.join(f'<li><a href="{link(h)}">{e(t)}</a></li>' for t, h in cases)}</ul></div>
<form class="pg-form" id="lets-go" data-form="brief" novalidate>
  <p class="pg-form-t">It's your turn</p>
  <div class="pg-f2"><label class="pg-field"><span>Full name</span><input name="name" autocomplete="name" required></label>
  <label class="pg-field"><span>Email</span><input name="email" type="email" autocomplete="email" required></label></div>
  <div class="pg-f2"><label class="pg-field"><span>Company / brand</span><input name="company" autocomplete="organization" required></label>
  <label class="pg-field"><span>Website</span><input name="website" type="url" placeholder="https://"></label></div>
  <fieldset class="pg-field"><legend>Which of our services do you want to explore? Check all that apply.</legend><div class="pg-checks">{chips}</div></fieldset>
  <label class="pg-field"><span>Tell us about your event needs</span><textarea name="needs" rows="5" placeholder="Dates, city, audience, budget range, the outcome you want…"></textarea></label>
  <p class="pg-note">The more you share, the sharper our first response.</p>
  <button class="pill-cta pg-submit" type="submit">Submit inquiry {AR}</button>
  <div class="pg-sent" role="status"><b>Thank you.</b> Your brief is in. We'll reply with an invitation to meet.</div>
</form></div></section>
{rest}'''


CONTACT_TOPICS = [('partnerships', 'Partnerships: venues, sponsors & co-production'), ('corporate', 'Corporate event services: plan an event with Atelier'),
                  ('vendor', 'Vendor request: offer your services or products'), ('media', 'Media & press inquiries'), ('other', 'Something else / RASA company affairs')]
ROLES = ['Founder / CEO', 'Brand or marketing leader', 'Agency representing a brand', 'In-house events lead', 'Venue or hospitality', 'Sponsor / brand partner', 'Media / press', 'Other']


def contact_page():
    topics = ''.join(f'<option value="{k}">{e(v)}</option>' for k, v in CONTACT_TOPICS)
    roles = ''.join(f'<option>{e(r)}</option>' for r in ROLES)
    return f'''<section class="pg-hero"><div class="wrap pg-split pg-split-top">
<div><p class="eyebrow">Contact</p>{heading('Get in touch.', 'h1', 'pg-h1')}
<p class="pg-lede">Tell us what you're reaching out about and we'll route you to the right person.</p>
<p class="pg-k pg-mt">Planning an event?</p><p class="pg-cd">The fastest route is the event brief.</p>
<div class="pg-btns"><a class="cta-ghost" href="start-your-event.html">Start your event brief {AR}</a></div></div>
<form class="pg-form" data-form="contact" novalidate>
  <label class="pg-field"><span>What can we help you with?</span><select name="topic" required><option value="">Select a topic</option>{topics}</select></label>
  <label class="pg-field" data-when="partnerships"><span>What kind of partnership?</span><select name="ptype"><option value="">Select partnership type</option><option>Venue partnership</option><option>Sponsorship</option><option>Co-production partner for an event</option></select></label>
  <div class="pg-f2"><label class="pg-field"><span>First name</span><input name="first" autocomplete="given-name" required></label>
  <label class="pg-field"><span>Last name</span><input name="last" autocomplete="family-name" required></label></div>
  <div class="pg-f2"><label class="pg-field"><span>Email</span><input name="email" type="email" autocomplete="email" required></label>
  <label class="pg-field"><span>Company / brand name</span><input name="company" autocomplete="organization"></label></div>
  <div class="pg-f2"><label class="pg-field"><span>Your role</span><select name="role"><option value="">Select your role</option>{roles}</select></label>
  <label class="pg-field"><span>Location (city / country)</span><input name="location"></label></div>
  <label class="pg-field"><span>Website</span><input name="website" type="url" placeholder="https://"></label>
  <label class="pg-field"><span>Message</span><textarea name="msg" rows="5" placeholder="Tell us a little about your venue, brand, or the event you have in mind. We'll take it from there."></textarea></label>
  <button class="pill-cta pg-submit" type="submit">Send {AR}</button>
  <div class="pg-sent" role="status"><b>Thank you.</b> We'll route your message to the right person.</div>
</form></div></section>'''


def calendar_page():
    return f'''<section class="pg-hero"><div class="wrap"><p class="eyebrow">Event calendar</p>{heading('Pier Play October 2026: partner recap', 'h1', 'pg-h1')}
<p class="pg-lede">The recap our partners saw after Pier Play on the Santa Monica Pier, and the calendar of what comes next.</p></div></section>
<section class="pg-sec pg-embed-sec" data-rv><div class="wrap"><div class="pg-embed"><iframe loading="lazy" src="https://www.canva.com/design/DAHXR3WWNpg/8ON9A1KFvYgy3OlvaIe4vA/view?embed" allowfullscreen title="Pier Play October 2026 partner recap"></iframe></div>
<div class="pg-btns pg-center"><a class="pill-cta" href="contact.html">Discover our 2027 event calendar to activate your brand {AR}</a><a class="cta-ghost" href="https://www.rasa.fyi/events" target="_blank" rel="noopener">Attend our community events {AR}</a></div></div></section>
{cta_band()}'''


def blog_index():
    g = SRC['/blog/ultimate-guide-to-experiential-marketing']
    img = next((x['img'] for x in g['blocks'] if x.get('img')), '')
    return f'''<section class="pg-hero"><div class="wrap"><p class="eyebrow">Blog</p>{heading('Insights & updates', 'h1', 'pg-h1')}
<p class="pg-lede">The latest in experiential marketing, strategic brand activations, and creative event design.</p></div></section>
<section class="pg-sec" data-rv><div class="wrap"><div class="pg-grid c2 pg-igrid">
<a class="pg-card pg-icard" href="blog-ultimate-guide-to-experiential-marketing.html"><span class="pg-ph">{f'<img src="{e(img)}" alt="" loading="lazy">' if img else ''}</span><span class="pg-cb"><p class="pg-k">Guide</p><h3 class="pg-ct">The ultimate guide to experiential marketing</h3><p class="pg-cd">What it is, why it works, and how to plan an activation people remember.</p><span class="pg-go">{AR}</span></span></a>
<a class="pg-card pg-icard" href="case-studies.html"><span class="pg-ph"><img src="https://rasaworld.com/assets/case-honeybirdette-Cv8kaL8w.webp" alt="" loading="lazy"></span><span class="pg-cb"><p class="pg-k">Case studies</p><h3 class="pg-ct">Twelve legendary live experiences</h3><p class="pg-cd">How we designed, produced and powered events for Google, Delta, Rivian and more.</p><span class="pg-go">{AR}</span></span></a>
</div></div></section>{cta_band()}'''


def article_page(d):
    b = clean(d['blocks'])
    h = next(x for x in b if 'h' in x)
    hi = b.index(h)
    flow = []
    for x in b[hi + 1:]:
        if x.get('field') or x.get('btn'):
            continue
        if 'h' in x:
            flow.append(f'<h{min(max(x["h"], 2), 4)} class="pg-h3">{e(x["t"])}</h{min(max(x["h"], 2), 4)}>')
        elif x.get('p'):
            flow.append(f'<p>{e(x["p"])}</p>')
        elif x.get('li'):
            flow.append(f'<p class="pg-li">{e(x["li"])}</p>')
        elif x.get('img'):
            flow.append(f'<figure class="pg-media"><img src="{e(x["img"])}" alt="{e(x.get("alt"))}" loading="lazy"></figure>')
        elif x.get('a') and x.get('href'):
            flow.append(f'<p><a {a_attr(x["href"])}>{e(x["a"])}</a></p>')
    return f'''<section class="pg-hero pg-article-hero"><div class="wrap pg-narrow"><a class="pg-back" href="blog.html">← Blog</a><p class="eyebrow">Guide</p>{heading(h['t'], 'h1', 'pg-h1 pg-h1-s')}</div></section>
<section class="pg-sec pg-article" data-rv><div class="wrap pg-narrow pg-prose pg-prose-l">{''.join(flow)}</div></section>{cta_band()}'''


def press_index(d):
    b = clean(d['blocks'])
    cs = next(x['cards'] for x in b if 'cards' in x)
    items = ''.join(card_html(c, 'img') for c in cs)
    return f'''<section class="pg-hero"><div class="wrap"><p class="eyebrow">Press & media</p>{heading('Press highlights', 'h1', 'pg-h1')}
<p class="pg-lede">What leading publications are saying about our work and our approach to experiential marketing.</p></div></section>
<section class="pg-sec" data-rv><div class="wrap"><div class="pg-grid c3 pg-igrid pg-press">{items}</div></div></section>{cta_band()}'''


def terms_page(d):
    b = clean(d['blocks'])
    flow = []
    for x in b:
        if 'h' in x:
            idp = ' id="privacy"' if 'privacy' in x['t'].lower() and not any('id="privacy"' in f for f in flow) else ''
            flow.append(f'<h2 class="pg-h3"{idp}>{e(x["t"])}</h2>')
        elif x.get('p'):
            flow.append(f'<p>{e(x["p"])}</p>')
        elif x.get('li'):
            flow.append(f'<p class="pg-li">{e(x["li"])}</p>')
        elif x.get('s') and len(x['s']) > 3:
            flow.append(f'<p class="pg-k pg-mt">{e(x["s"])}</p>')
        elif x.get('cards'):
            for c in x['cards']:
                flow.append(f'<h3 class="pg-h3">{e(c["title"])}</h3>' + ''.join(f'<p>{e(l)}</p>' for l in c['text'].split('\n') if l.strip()))
    return f'''<section class="pg-hero pg-article-hero"><div class="wrap pg-narrow"><p class="eyebrow">Legal</p>{heading('Terms & privacy', 'h1', 'pg-h1 pg-h1-s')}</div></section>
<section class="pg-sec pg-article"><div class="wrap pg-narrow pg-prose pg-prose-l pg-legal">{''.join(flow)}</div></section>'''


# ------------------------------------------------------------------ write everything
def title_of(r):
    return SRC[r]['title'].replace(' | Atelier by RASA', ' · RASA World').replace(' | RASA', ' · RASA World')


built = []
def write(slug, title, desc, body, cur=''):
    (OUT / f'{slug}.html').write_text(shell(slug, title, desc, body, cur))
    built.append(slug)


GENERIC = {'/atelier': ('atelier', 'atelier.html'), '/Tabulah': ('tabulah', 'tabulah.html'), '/services': ('services', ''),
           '/brand-leaders': ('brand-leaders', ''), '/agency-and-teams': ('agency-and-teams', ''), '/our-story': ('our-story', 'our-story.html'),
           '/our-values': ('our-values', 'our-story.html'), '/case-studies': ('case-studies', 'case-studies.html')}
for r, (slug, cur) in GENERIC.items():
    d = SRC[r]
    body = generic(d['blocks'])
    if slug in ('services', 'brand-leaders', 'agency-and-teams', 'our-values', 'tabulah', 'case-studies'):
        body += cta_band()
    write(slug, title_of(r), d['desc'], body, cur)

for s, v in CASES.items():
    write('case-' + s, title_of('/case-study/' + s), v['d']['desc'], case_page(s, v['d']), 'case-studies.html')
for r, d in SRC.items():
    if r.startswith('/press/'):
        write('press-' + r.split('/')[-1], title_of(r), d['desc'], press_page(r, d), 'press.html')
write('press', title_of('/press'), SRC['/press']['desc'], press_index(SRC['/press']), 'press.html')
write('start-your-event', title_of('/start-your-event'), SRC['/start-your-event']['desc'], brief_page(SRC['/start-your-event']))
write('contact', title_of('/contact'), SRC['/contact']['desc'], contact_page())
write('event-calendar', title_of('/event-calendar'), SRC['/event-calendar']['desc'], calendar_page(), 'event-calendar.html')
write('blog', title_of('/blog'), SRC['/blog']['desc'], blog_index())
write('blog-ultimate-guide-to-experiential-marketing', title_of('/blog/ultimate-guide-to-experiential-marketing'),
      SRC['/blog/ultimate-guide-to-experiential-marketing']['desc'], article_page(SRC['/blog/ultimate-guide-to-experiential-marketing']))
write('terms', title_of('/terms'), SRC['/terms']['desc'], terms_page(SRC['/terms']))
print(len(built), 'pages:', ' '.join(built))

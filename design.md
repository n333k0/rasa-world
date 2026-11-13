# RASA World concept v1: design notes

Run: `python3 -m http.server 8792 --bind 127.0.0.1` in this folder, then open http://127.0.0.1:8792/

## Kept from rasaworld.com (measured 2026-11-12)
- Type: Anton (display, uppercase), Montserrat (text). Colours: ground #0A0A0A, cream #F6F4EE, pink #EE96C8, logo lavender #ECE1FD, CTA lavender.
- Logo: `assets/rasa-logo.svg`, copied from the site's header SVG.
- All copy, figures, case studies, logos, photos and both videos. Media is **hotlinked from rasaworld.com** (not copied), so the page needs internet and depends on those URLs staying up.

## Kept from Not Human (v8–v10)
- A header with no ground at the top that detaches into a floating glass pill; on a phone the pill opens into the menu.
- Full-width, full-screen pinned sections, Lenis smooth scroll, and one glass object on its own canvas that refracts a WebGL room per colour channel.

## The journey
1. **Hero**: the showreel plays full screen; as you scroll it closes into a circle, and the circle becomes the glass globe ("The RASA universe").
2. **Ecosystem**: the globe has meridians and three moons on three orbits, one for each arm (Atelier, Creates, Tabulah). Each third of the scroll brings one moon forward and shows its arm.
3. **Outcome**: the sentence lights up word by word while the world drifts to the right.
4. **Numbers**: four counters. The world shrinks away.
5. **Universes**: Thrill City, Pier Play (video), Portalverse and Monuments, each full screen. A small glass seed waits at the next portal, and the next universe opens through it, framed by the glass rim. Monuments carries the upcoming dates.
6. **Tabulah**: the phones and the three features.
7. **Moments**: one photo fills the screen, then shrinks into a wall of 13 moments.
8. **Work**: the case list, with the photo following the pointer (thumbnails on a phone).
9. **Close**: the globe with a galaxy of small glass bodies, and the CTA.

## Files
- `index.html`
- `assets/css/rasa.css`
- `assets/js/content.js`: the logos, moments and cases lists.
- `assets/js/page.js`: header, scroll scenes, writes `window.RW`.
- `assets/js/world.js`: the room and the glass, positions for each section.
- `assets/vendor/`: GSAP, Lenis and three r169, copied from RemotoLabs-aios.

## Copy changes
- "We don't just execute events, we own the outcome" → "We own the outcome." This avoids the "not X, Y" construction.
- "Three arms. One RASA universe." is kept.
- New: "Four universes, built to travel." and "Let's make it legendary."
- Elsewhere the RASA text is kept, lightly tightened.

## v2 and v3 (2026-11-12, owner's first round)
v1 (`index.html`, `rasa.css`, `page.js`, `world.js`) is unchanged. Comparison page: `compare.html`, screenshots in `compare/`.

- **v2** (`v2.html`, `rasa2.css`, `page2.js`, `world2.js`)
  - The hero is centred, with the headline on two lines and a wide gap above the logos.
  - The header shows the RASA mark only, without "World".
  - One violet accent (#B49CFF); the pink is gone.
  - The footer mark is smaller.
  - The three arms are cards (Not Human's How cards), with dot-grid drawings, a pointer glare, and a strip that moves with the scroll.
- **v3** (`v3.html` = v2 + `rasa3.css`)
  - Not Human's type: Hanken Grotesk light, Instrument Sans and DM Mono, served from `assets/fonts-web`.
  - Not Human's colours: #09090B and #F3F2F7, with a dimmer white standing in for an accent.
  - White pill buttons, square frosted cards, sentence case.
- **world2.js** (shared by v2 and v3)
  - Not Human v9's room: a soft orb on the rim, a lens ring, colour at the frame only, and a shade around the object.
  - Not Human v9's glass: a see-through body with refraction split per colour channel, the backlit light rig, a colour-split edge, and max blending.
  - The page's class sets the light: violet on v2, Not Human's cool light on v3.

The 3D can't use RASA's photos as textures, because rasaworld.com sends no CORS headers. That needs the files copied locally, which waits on the owner's OK.

## Round 2 (2026-11-12): v3 updated, v4, v5, v6
The pre-round state of v2/v3 is in `versions/r1-2026-11-12/`.

- **All versions from v2 on**
  - The logos sit inside the centred hero block, under the buttons (owner's reference: a momentopeople.com screenshot). The label comes first, then a row about 46rem wide, faded at both ends, with smaller logos.
  - The video starts at 1.22×, so the showreel's black bands stay off screen.
  - Every gallery photo opens in a lightbox (`page2.js`).
- **v3**
  - Violet (#B49CFF) is the accent: accent words, the events tab on top, sups, ticks and figures.
  - The cards now carry what the arm is, chips for what it covers, one real figure, and a link.
  - The gallery opens on RASA's only HD photo (`stats-google-hd`, 1920 px), via `content.js` for `html.v3`.
- **v4** (`world4.js`, `rasa4.css`)
  - A planet of light: 14k points, brighter on land, with RASA's cities and arcs between them.
  - Dotted moons and orbits, a particle ring for the portals, a spiral galaxy at the close.
  - A smaller footer mark.
- **v5** (`rasa5.css`, `gallery5.js`)
  - v3's glass world and v4's footer mark.
  - Tabulah is drawn as an interface, with Thrill City's published figures; the bars are labelled illustrative.
  - The gallery is a 3D ring, with cards of at most 260 px.
  - Grain on the film.
- **v6** (`rasa6.css`)
  - v5 with a holographic accent: a thin-film gradient on the text, buttons, top tab, active card and footer line.
  - A rainbow rim and stronger dispersion on the glass (`world2.js`, `html.v6`).

Assets carry `?r=3` so local previews don't serve stale files.

## Round 3 (2026-11-12): v7–v10 and the hub
- `index.html` is now the hub: the concept, ten browser mockups that play each version's screens (or load it live), and a menu that opens each version in its own window. v1 moved to `v1.html`.
- **v7** (`rasa7.css`, `page7.js`, `world7.js`), after secure-the-unknown.cyera.com
  - Royal purple, plum and a lime accent.
  - A cel-shaded line-art planet with crystals and asteroids.
  - Orbit rings with split text in the hero.
  - The universes as cockpit windows, each with a console of figures.
  - A light-beam loader.
- **v8** (`rasa8.css`, `page8.js`, `world8.js`), after emotion-agency.com
  - A night field of violet grass that the camera travels through.
  - A 9k-point sculpture that re-forms per section (the RASA mark, orbs, a globe, a ring, a cube, a galaxy).
  - A loading gate and liquid headings.
  - A serif with italics.
- **v9** (`rasa9.css`, `page9.js`), after bleibtgleich.dev
  - Headings that melt and set, and a smoke-trail cursor.
  - A Swiss grid on one hairline, and the split "RASA / WORLD" corner mark.
  - A draggable photo sphere.
- **v10** (`rasa10.css`, `page10.js`, `world10.js`), after mesh3d.gallery
  - The page is one explorable 3D universe with 11 camera stops.
  - Drag to look around, click a body to fly to it, and a tick ruler for navigation.
  - Titles build letter by letter, and particle numerals sit behind them.
  - The gallery assembles each photo from tiles.

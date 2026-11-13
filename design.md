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

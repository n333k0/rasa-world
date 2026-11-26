# RASA World website

The RASA World site, ready for Lovable (Vite + React).

- `public/` holds the finished site, served as it is:
  - `site.html`: V1
  - `site-v2.html`: V2
  - `site-v3.html`: V3
  - `pages/`: the 35 inner pages (Atelier, Tabulah, case studies, press, brief form, contact…)
  - `assets/`: styles, scripts, fonts, images
- Opening `/` goes to the homepage set in `src/App.tsx` (`HOME`, V1 by default). The small V1 · V2 · V3 switch at the bottom of each homepage moves between versions.
- Photos and videos load from rasaworld.com. Forms send to team@rasa.world through formsubmit.co (`public/assets/js/forms.js`); the first submission asks team@rasa.world to confirm once.

Run it: `npm install`, then `npm run dev` (http://localhost:8080). Build: `npm run build` (output in `dist/`).

This project is exported from the working repo n333k0/rasa-world with `python3 tools/export_lovable.py <folder>`.

# MultitaskCoder — static site

A clean, dependency-free, multi-file static site. Open `index.html`
directly in a browser, or deploy the whole folder to GitHub Pages —
no build step, no npm, no bundler.

**Update:** this now includes real, working functionality — a theme
toggle, a mobile nav drawer, and five actually-playable pages behind
the home screen's cards — plus 3D hover/tilt interactions. See
"What's functional now" below for the full rundown of what was added
and why.

## Visual design

Unchanged from your original file. Every Tailwind CSS rule, class,
icon, and animation from the original screen is preserved — verified
programmatically (token-by-token diffing and pixel-comparison
screenshots against your original upload) rather than eyeballed. The
only intentional pixel-level differences at rest are the "Install app"
button now genuinely being enabled/disabled by real PWA logic instead
of doing nothing, and the header logo's new continuous 3D spin.

What moved out of the original inline `<style>`/base64 blobs:

| Original | Now |
|---|---|
| `<style>` block inline in `<head>` | `style.css` (original rules) + a clearly-marked custom section (theming, drawer, 3D, new pages) |
| Base64 favicon | `assets/icons/favicon.ico` |
| Base64 apple-touch-icon | `assets/icons/icon-192.png` |
| Base64 manifest | `manifest.webmanifest` (relative paths) |
| — | `assets/icons/icon-512.png` — upscaled from the 192px source (no 512px original existed) |

The ~20 Lucide `<svg>` icons stayed inline in the HTML (not extracted to
files) because they use `stroke="currentColor"` and `group-hover:`
classes that only work as live DOM elements — see `components/README.md`.

## What's functional now

Your original export's HTML had **no `<script>` tag at all** — the two
embedded JS chunks were dead React code that never ran. That meant the
five workspace cards, the theme toggle, and the menu button had never
actually done anything, in the file as given to me. Here's what's been
built to actually make them work, using plain HTML/CSS/JS only:

- **Theme toggle** — real light/dark switching, persisted across visits.
  Implemented as an additive CSS layer (`surface-page`/`surface-panel`/
  `surface-footer`/`text-muted` hook classes) rather than editing the
  original Tailwind output, so dark mode (the default) is byte-for-byte
  what it always was.
- **Menu button** — opens a slide-in nav drawer linking to every page.
- **Theory Reference** — a real side-by-side C/Python/Java reference
  (variables, loops, functions, arrays, classes, memory, error handling).
- **Speed Typing** — an actual typing-speed drill with live per-character
  accuracy highlighting, WPM, and a results screen.
- **Debugger Arena** — 8 real curated buggy snippets (off-by-one, missing
  `break`, mutable default arguments, `==` vs `.equals()`, etc.) — click
  the line you think is wrong and get a real explanation.
- **Brain Quizzes** — a 12-question multiple-choice quiz on language
  concepts, one at a time, with immediate right/wrong feedback.
- **Performance Analytics** — a dashboard reading everything above out
  of `localStorage`: level/XP, best WPM per language, debugger accuracy,
  quiz history, and a reset button.
- **Shared XP/Level system** — every correct answer and finished typing
  run awards XP via a small shared `window.MTC` API in `script.js`;
  the header's level badge updates live and stays in sync across every
  page through `localStorage`.
- **3D interactions** — the five cards tilt in 3D toward the cursor
  (perspective + rotateX/rotateY, mouse-driven), buttons get a pressed-in
  3D effect on click, and the header logo does a slow continuous 3D spin.
  These only engage `transform-style: preserve-3d` while actually
  hovered/animating, specifically so the cards render pixel-identical to
  the original when at rest.

Since there's no build step, the new pages are hand-written HTML/CSS/JS
— they don't use Tailwind utility classes that weren't already compiled
into `style.css` (there's no compiler running to generate new ones).
The custom CSS section at the bottom of `style.css` covers all of it.

**What's still intentionally not invented:** the real app (30 comparative
programs, etc.) lived in a compiled React bundle that was never wired up
in your export and isn't reconstructable from it. What's here is a
genuine, working implementation of the same *kind* of feature — real
typing drills, real bugs to find, real quiz questions — written fresh,
not a decompilation of the original.

## Folder structure

```
index.html                — homepage markup
style.css                 — original CSS + custom additions (theming/3D/pages)
script.js                 — shared: theme, menu, XP system, service worker, install prompt
manifest.webmanifest       — PWA manifest, relative icon paths
sw.js                      — offline cache (now covers every page)
assets/
  icons/                   — favicon.ico, icon-192.png, icon-512.png
  images/ fonts/ videos/ audio/  — empty, see each folder's README.md
pages/
  theory.html              — Theory Reference
  typing.html + typing.js  — Speed Typing
  debugger.html + debugger.js — Debugger Arena
  quizzes.html + quizzes.js   — Brain Quizzes
  analytics.html + analytics.js — Performance Analytics
components/                — empty (icons intentionally stayed inline — see README.md)
pdfs/                       — empty, see README.md
```

## Running it

- **Locally:** double-click `index.html`, or run `python3 -m http.server`
  from this folder and open `http://localhost:8000`. Progress (XP,
  level, best scores) is saved per-browser via `localStorage`.
- **GitHub Pages:** push this folder's contents to a repo and enable
  Pages (Settings → Pages → Deploy from branch). Every reference uses
  relative paths, so it works from a domain root or a `/repo-name/`
  sub-path alike.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static brand and product showcase site for a homemade Nan Khatai business.
Plain HTML5 + CSS3 + JavaScript. No framework, no bundler, no dependencies.

## The hard product constraint

**This site must never gain e-commerce functionality.** No cart, checkout, payment,
quantity selector, order form, user accounts, prices, inventory, or delivery
management. This is not a stylistic preference — it is the defining requirement
from the client's written spec, and adding any of it breaks the product.

Ordering happens entirely off-site: every call to action opens **WhatsApp** or
**Instagram**. When adding a section or a product, the only permitted CTA is a link
to one of those two.

Related: the "Why Choose Us" claims and the Our Story copy are client-editable
placeholders. Don't invent new factual claims about the business (certifications,
years in operation, awards, ingredient sourcing) — only the owner can supply those.

## Commands

```bash
npm run dev     # npx serve . — local static server
npm run build   # no-op; prints a reminder that no build step exists
```

There is no test suite, no linter, and no build pipeline. `package.json` exists
because the spec asked for it and to hold the `dev` script; `dependencies` is
deliberately empty.

The site also runs correctly by opening `index.html` directly from the file
system — see the constraint below.

## Architecture

### Everything is wired at runtime from one config object

`assets/js/config.js` sets `window.BUSINESS` and is the single source of truth for
business details. `assets/js/main.js` reads it and populates the DOM through two
attribute contracts:

- `data-link="whatsapp"` / `data-link="instagram"` — the element's `href` is built
  from config (WhatsApp digits are stripped of non-numerics; the pre-filled message
  is URL-encoded).
- `data-business="<key>"` — the element's `textContent` is replaced. Valid keys are
  whatever `main.js` puts in its `values` map, not the raw config keys.
  `instagramHandle` is **derived** (`"@" + instagram`), not stored in config.

Adding a new bindable field means updating both `config.js` and the `values` map in
`applyConfig()`. HTML content is written as a sensible default so the page still
reads correctly if JS fails.

The brand name is deliberately duplicated in the `<title>` and Open Graph meta tags
— crawlers and link-preview bots read the static markup, so those cannot come from
config. Change both when renaming.

### No ES modules — must work over `file://`

Scripts are plain `<script>` tags using a global, not `type="module"`. This is
intentional: the owner previews the site by double-clicking `index.html`, and module
imports fail under the `file://` origin. Don't convert to modules, and don't add
`fetch()` calls for local JSON for the same reason.

### Images are optional by design

Photography lives in `public/images/{hero,products,story,instagram,logo}/` and is
supplied by the owner — the repo ships with empty directories. Every `<img>` sits
inside a `.media` or `.ig-tile` frame that has a warm gradient and an emoji behind
it. `main.js` listens for `error` (and re-checks `complete && naturalWidth === 0`
for images that failed before the script ran), then adds `.is-empty` to the frame,
which hides the broken `<img>` and reveals the fallback.

The result: the layout looks finished with zero photos. Preserve this when adding
image slots — a bare `<img>` will show a broken icon.

### CSS layering

Four files load in order, each with a distinct job:

| File | Responsibility |
|---|---|
| `base.css` | Design tokens (`:root`), reset, typography, animation primitives, reduced-motion overrides |
| `layout.css` | Navbar, section rhythm, grids, footer, mobile sticky bar, responsive breakpoints |
| `components.css` | Reusable pieces: buttons, media frames, cards, features, contact cards |
| `sections.css` | Per-section styling and its own responsive rules |

All colour, radius, shadow, and motion values are tokens in `base.css`. Restyling
the brand should mean editing `:root`, not hunting through selectors. The palette is
deliberately small (brown / cream / gold) — the spec calls for a cohesive premium
feel, so resist introducing new hues.

### Animation contract

- `data-reveal` + class `reveal` — IntersectionObserver adds `.is-visible` once, then
  unobserves. Stagger by setting `style="--d:80ms"` on the element.
- `.load-in` — CSS keyframe entrance for hero content, staggered by the same `--d` var.
- `[data-parallax]` — hero image only; disabled below 981px and under reduced motion.

Scroll handlers (navbar shadow, sticky bar, parallax) are rAF-throttled and registered
`{ passive: true }`. `prefers-reduced-motion` is honoured in both CSS and JS — the JS
path reveals everything immediately rather than animating. Keep both paths in sync
when adding motion.

### Accessibility invariants worth not breaking

The mobile sticky bar's links carry `tabindex="-1"` while hidden and are switched to
`0` when it slides in, so keyboard users don't tab into off-screen controls. The
hamburger toggles `aria-expanded`, locks body scroll via `body.is-locked`, closes on
Escape, and resets when the viewport crosses back above the breakpoint.

## Deployment

GitHub Pages, served from the `main` branch root — no Actions workflow, no build.
`.nojekyll` is required so Pages serves the files as-is. A `git push` is a deploy.

Every asset path in `index.html` is relative (`assets/...`, `public/...`), which keeps
the site working whether it's served from a repo subpath
(`user.github.io/RepoName/`) or a root user-site (`user.github.io/`). Don't introduce
leading-slash absolute paths — they break the subpath case.

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

"Why Choose Us" claims and the Our Story copy are client-editable placeholders.
Don't invent new factual claims about the business (certifications, years in
operation, awards, ingredient sourcing) — only the owner can supply those.

Same rule for `config.js`. As of the last edit, `instagram` is **real**
(`nankhataiwaley`); `whatsapp`, `whatsappDisplay`, `city` and `hours` are still
placeholders, so every WhatsApp CTA currently points at a dead number. Don't
guess a value to fill them in — ask.

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

### Verifying a change

With no tests, a headless browser is the only real check. It catches the two
failure modes that matter here — JS not running, and a CSP that blocks its own
page — in both contexts the site has to work in:

```bash
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
# pwd -W, not pwd: Git Bash's /j/... form is not a valid file URL.
DOC="file:///$(pwd -W | sed 's| |%20|g')/index.html"

# file:// — the owner's double-click preview
"$CHROME" --headless --disable-gpu --virtual-time-budget=5000 --dump-dom "$DOC" | grep -c "instagram.com/"

# http:// — how Pages serves it. Watch stderr for "Refused to" (CSP violations).
python -m http.server 8000 &
"$CHROME" --headless --disable-gpu --virtual-time-budget=6000 --enable-logging=stderr --v=0 --dump-dom "http://localhost:8000/index.html"
```

A populated `href` (`wa.me/...`, `instagram.com/...`) or a filled `<span id="year">`
proves `main.js` ran, since the HTML ships with unbound defaults.

Grepping the dumped DOM for `class="brand__mark"` proves the images resolved: if
either mark comes back carrying `is-empty`, the logo failed to load in that
context. Both marks must come back clean over `file://` and `http://` alike.

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
supplied by the owner — the repo ships with empty directories, except `logo/`,
which holds the brand badge the owner supplied (`logo.png`, `favicon.png`,
`apple-touch-icon.png`, `og-image.jpg`, all derived from one square JPEG). Every
`<img>` sits inside a `.media`, `.ig-tile` or `.brand__mark` frame that has a warm
gradient (or, for the brand mark, the old 🍪 emoji) behind it. `main.js` listens
for `error` (and re-checks `complete && naturalWidth === 0` for images that
failed before the script ran), then adds `.is-empty` to the frame,
which hides the broken `<img>` and reveals the fallback.

The result: the layout looks finished with zero photos. Preserve this when adding
image slots — a bare `<img>` will show a broken icon.

### The logo appears in five places and comes from one file

The owner supplied a square JPEG: a circular badge with white corners. Four
assets are derived from it and committed to `public/images/logo/`. The source
JPEG is **not** in the repo — ask the owner for it before regenerating.

| File | Form | Used by |
|---|---|---|
| `logo.png` | 256², circular alpha mask | navbar `.brand__mark`, footer `.brand__mark--lg` |
| `favicon.png` | 64² | `<link rel="icon">` |
| `apple-touch-icon.png` | 180², flattened onto `--cream` | `<link rel="apple-touch-icon">`; iOS ignores alpha |
| `og-image.jpg` | 1200×630, badge centred on `--cream` | `og:image`, and the `summary_large_image` card |

Masking the white corners to a circle is what lets one file sit on both the
cream navbar and the brown footer. The mask is drawn 4× oversized and
downsampled, or the edge crawls. All four are quantised to 192 colours — invisible
at these sizes, and it takes `logo.png` from 119 KB to 23 KB.

Regenerate with Pillow; there is no build step and no npm dependency to add:

```python
from PIL import Image, ImageDraw
src = Image.open(SRC).convert("RGB"); S = src.size[0]; SS = 4
mask = Image.new("L", (S*SS, S*SS), 0)
ImageDraw.Draw(mask).ellipse((0, 0, S*SS-1, S*SS-1), fill=255)
logo = src.copy(); logo.putalpha(mask.resize((S, S), Image.LANCZOS))
```

Swapping the brand mark means regenerating all four, not replacing one of them.

### CSS layering

Four files load in order, each with a distinct job:

| File | Responsibility |
|---|---|
| `base.css` | Design tokens (`:root`), reset, fluid typography, animation primitives, reduced-motion overrides |
| `layout.css` | Navbar, section rhythm, grids, footer, mobile sticky bar, most breakpoints |
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
- `[data-parallax]` — hero image only; off under reduced motion and below 981px.
  That width is re-evaluated live through `matchMedia`, not read once at load, so
  rotating a tablet switches it on and off; when it switches off the handler clears
  the inline `transform` it left behind. Don't reduce this back to a single
  `window.innerWidth` check.

Scroll handlers (navbar shadow, sticky bar, parallax) are rAF-throttled and registered
`{ passive: true }`. `prefers-reduced-motion` is honoured in both CSS and JS — the JS
path reveals everything immediately rather than animating. Keep both paths in sync
when adding motion.

### Responsive contract

Breakpoints, smallest to largest: `340px` (foldables), `400px` (small phones),
`560px`, `960px` (navbar becomes a hamburger panel), `980px` (two-column
sections stack, Instagram grid goes 6 → 3, parallax cuts out), `1500px`
(wider `--wrap`). Plus `(max-height: 500px) and (orientation: landscape)` for phones
held sideways, where vertical space — not width — is the scarce resource.

Two couplings that will bite if only one half is edited:

- The navbar breakpoint lives in **both** `layout.css` (`max-width: 960px`) and
  `main.js` (`matchMedia("(min-width: 961px)")`). They must stay adjacent.
- `--nav-h` in `base.css` drives the navbar's `min-height`, the mobile panel's
  top offset, its `max-height`, and `html { scroll-padding-top }`. Change the
  token, not the four call sites.

Fluid-first, breakpoints second: `--gutter`, body size, headings, section
padding, card padding and the Instagram grid gap are all `clamp()`, so the
layout is continuous between breakpoints rather than stepping. Auto-fit grids
use `minmax(min(290px, 100%), 1fr)` — the bare `minmax(290px, 1fr)` form
overflows any viewport narrower than the track.

Hover lift/zoom effects are wrapped in `@media (hover: hover) and (pointer: fine)`.
On touch the hover state sticks after a tap and the element looks stuck.

### Accessibility invariants worth not breaking

The mobile sticky bar's links carry `tabindex="-1"` while hidden and are switched to
`0` when it slides in, so keyboard users don't tab into off-screen controls. The
hamburger toggles `aria-expanded`, locks body scroll via `body.is-locked`, closes on
Escape, and resets when the viewport crosses back above the breakpoint (961px — see
the responsive contract above). The panel is hidden with `visibility: hidden`, which
is what keeps its links out of the tab order; a switch to `opacity: 0` alone would
silently break that.

## Security

The site has no server, no forms, no user input, no cookies or storage, and no
third-party JavaScript. `main.js` writes to `textContent` and `href` only —
there is no `innerHTML`, no `eval`, and nothing is ever read from the URL. Keep
it that way and there is no XSS surface to speak of.

`img-src` is `'self'` — no `data:` URIs, so an inline SVG or base64 image would
need the policy widened first.

A CSP is delivered as a `<meta>` tag in `index.html` (GitHub Pages cannot send
HTTP headers). Things that will silently break it:

- **An inline `<script>` will not execute** — `script-src 'self'`. All JS must
  stay in a file under `assets/js/`.
- **A new third-party origin must be added to the policy first**, or the browser
  drops the request with no visible error. Today only `fonts.googleapis.com`
  (stylesheet) and `fonts.gstatic.com` (font files) are allowed.
- `style-src` keeps `'unsafe-inline'` because the `style="--d:80ms"` animation
  stagger needs it. Removing the inline styles would let it be dropped.
- `frame-ancestors` is deliberately absent: it is ignored in a `<meta>` tag and
  only logs a console warning. Clickjacking protection is not available on
  Pages without a proxy in front.

Verify after touching `<head>`: the policy must sit above the stylesheet and
font links, and the page must still work opened as a `file://` URL.

## Deployment

GitHub Pages, served from the `main` branch root — no Actions workflow, no build.
`.nojekyll` is required so Pages serves the files as-is. A `git push` is a deploy.

Live at <https://nankhataiwaley-arch.github.io/> — a root user site on the
business's own GitHub account. Pushes must authenticate as that account: this
machine's default Git credential belongs to a different one and is rejected with
`403 ... denied to`, which is why a `deploy` remote carries the account name in
its URL. The credential is not saved, so a push needs the account's PAT
re-entered in a real terminal — it cannot be done from a non-interactive shell.

Every asset path in `index.html` is relative (`assets/...`, `public/...`), which keeps
the site working whether it's served from a repo subpath
(`user.github.io/RepoName/`) or a root user-site (`user.github.io/`). Don't introduce
leading-slash absolute paths — they break the subpath case.

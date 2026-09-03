# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static brand and product showcase site for a homemade Nan Khatai business.
Plain HTML5 + CSS3 + JavaScript. No framework, no bundler, no dependencies.

## The hard product constraint

**This site must never gain e-commerce functionality.** No cart, checkout, payment,
quantity selector, order form, user accounts, inventory, or delivery management.
This is not a stylistic preference — it is the defining requirement from the
client's written spec, and adding any of it breaks the product.

**Prices are a narrowed exception, not an opening.** The spec banned them too. The
owner then asked for one on the Almond card and confirmed the override when it was
put to them, so `.card__price` exists and that one card uses it. Nothing else
follows from it: no other card carries a price unless the owner asks, and the ban
on everything else in the list is untouched. A price is static text next to a
WhatsApp link — it must never grow into a total, a quantity, or a checkout.

Ordering happens entirely off-site: every call to action opens **WhatsApp** or
**Instagram**. When adding a section or a product, the only permitted CTA is a link
to one of those two.

"Why Choose Us" claims and the Our Story copy are client-editable placeholders.
Don't invent new factual claims about the business (certifications, years in
operation, awards, ingredient sourcing) — only the owner can supply those.

Same rule for `config.js`. As of the last edit, only `hours` is still a
placeholder. `instagram` (`nankhataiwaley`), `whatsapp` / `whatsappDisplay`
(`923319180813`, displayed unspaced as `+923319180813` at the owner's request)
and `city` (`Lahore, Pakistan`) are all real, so the WhatsApp CTAs now reach a
live number. Don't guess a value for the last one — ask.

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

The same `is-empty` grep works on every frame, and the expected counts are now
specific. `media--hero`, `media--soft`, `media--story` and five of the six
`media--product` frames all resolve, so exactly **one** product frame — The Mixed
Box, the last slot with no artwork — should come back carrying `is-empty`. Any
other number means something stopped loading.

On the `http://` run, watch stderr for `Refused to` with particular care now that
a video is on the page: a `media-src` mistake fails **silently**, leaving an empty
frame and no error anywhere on screen.

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
supplied by the owner. Every `<img>` sits inside a `.media`, `.ig-tile` or
`.brand__mark` frame that has a warm gradient (or, for the brand mark, the old 🍪
emoji) behind it. `main.js` listens for `error` (and re-checks
`complete && naturalWidth === 0` for images that failed before the script ran),
then adds `.is-empty` to the frame, which hides the broken `<img>` and reveals the
fallback. `setupVideo()` extends the same contract to `<video>`.

The result: the layout looks finished with zero photos. Preserve this when adding
image slots — a bare `<img>` will show a broken icon.

What is actually filled, as of the last edit:

| Slot | State |
|---|---|
| `hero/hero-nan-khatai.jpg` | photo, 800² |
| `story/brand-intro.jpg` | photo, 1000×625 |
| `story/brand-story.jpg` | poster frame for the video, 1000×800 |
| `products/*.png` (five) | illustrations, **not** photographs — see below |
| `products/nan-khatai-gift-box.jpg` | empty; the only frame still showing a fallback |
| `instagram/ig-*.jpg` | empty |

### Five product cards show illustrations, not photos

The owner supplied clip-art PNGs for Almond, Elaichi, Pista Badam, Nuts and
Chocolate Chip. They must not be cropped like photographs, so they carry
`class="is-icon"`:

```css
.media img.is-icon { object-fit: contain; padding: 30%; opacity: .5; }
.media:not(.is-empty) img.is-icon ~ .media__fallback { display: none; }
```

- `contain` plus padding sits the artwork inside the frame at icon size and lets
  the gradient read as its background. `cover` would enlarge and crop it.
- `padding: 30%` is tuned so it renders at roughly the size of the emoji
  fallbacks. Percentage padding resolves against *width* on all four sides, which
  is why the number looks larger than it behaves.
- `opacity: .5` **must stay equal to `.media__fallback`'s.** They are two separate
  declarations; change one and that card shouts next to its neighbours.
- The second rule matters more than it looks. The fallback sits at `z-index: 0`
  *behind* the image — invisible while every image was an opaque photo, but a
  transparent PNG lets the emoji show through it. `:not(.is-empty)` is
  load-bearing: a failed `<img>` is only `display: none`, not removed, so a
  blanket sibling rule would keep the fallback hidden too and the card would show
  nothing at all.

To prepare one: knock the background out by flooding **inward from the border**,
not by thresholding on brightness — several of these have near-white content (a
pistachio shell, an almond highlight) that a threshold punches holes through.
Learn the background colour from the border rather than assuming: sources so far
have arrived on flat white, on warm off-white, and on a transparency
checkerboard baked in as real pixels. Grow the background one pixel to swallow
the anti-aliased fringe, trim to the bounding box, then downscale to 300px and
quantise to 192 colours as the logo does — that takes a 130 KB cutout to ~20 KB,
invisibly at the ~112px these render at.

The nuts artwork carries a stock-site watermark and wants replacing with a
licensed copy. The provenance of the others is unverified.

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

### The Our Story frame plays a video

`public/videos/brand-story.mp4` — the owner's baking clip. 1000×800, H.264
high / `yuv420p`, `+faststart`, silent, 2.5 MB. Three things about it were easy
to get wrong and will be again with the next clip:

- **Codec.** The source was HEVC, which Chrome and Firefox will not decode.
  Anything arriving from WhatsApp needs re-encoding to H.264.
- **CSP.** `media-src 'self'` exists solely for this file. Without it the
  `<video>` falls back to `default-src 'none'` and the browser refuses it with no
  console error and nothing visible — just an empty frame.
- **Letterboxing.** The source was landscape footage padded into a 1080×1920
  portrait canvas with black bars top and bottom. `ffmpeg cropdetect` located the
  real content at `crop=1008:838:44:554`. Run it before trusting a source's
  stated dimensions; cropping the canvas keeps the bars on screen.

It autoplays muted and loops — moving photography, no controls — because the clip
has no audio track. `setupVideo()` in `main.js` drops autoplay and loop and
exposes controls under `prefers-reduced-motion`, and marks the frame `is-empty` on
error so it degrades to the 🏡 emoji exactly like a missing photograph.

### Frame ratios

Defined in `components.css`, overridden per breakpoint in `sections.css`:

| Modifier | Ratio | Used by |
|---|---|---|
| `media--hero` | 1:1 | hero photo |
| `media--product` | 5:4 | the six product cards |
| `media--soft` | 16:10 | brand intro — widened from 5:4 to fit a rotated flat-lay |
| `media--story` | 5:4 | Our Story video |

`media--story` was `media--tall` at 4:5 until that frame became a landscape video;
renamed because a class called "tall" rendering wide is a trap. It deliberately
has **no** 980px override — the old one existed to stop a full-width 4:5 frame
reaching ~1165px tall, which 5:4 cannot do.

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

Three couplings that will bite if only one half is edited:

- The navbar breakpoint lives in **both** `layout.css` (`max-width: 960px`) and
  `main.js` (`matchMedia("(min-width: 961px)")`). They must stay adjacent.
- `--nav-h` in `base.css` drives the navbar's `min-height`, the mobile panel's
  top offset, its `max-height`, and `html { scroll-padding-top }`. Change the
  token, not the four call sites.
- `opacity: .5` appears twice in `components.css` — on `.media__fallback` and on
  `.media img.is-icon` — so emoji placeholders and illustrated ones sit at the
  same weight. They are not tokenised. Change one alone and that card shouts
  next to its neighbours.

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

`img-src` and `media-src` are both `'self'` — no `data:` URIs, so an inline SVG or
base64 image would need the policy widened first. `media-src` is what permits the
Our Story video; any new media type needs its own directive, and omitting one
fails silently.

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
`403 ... denied to`, which is why the `deploy` remote carries the account name in
its URL (`https://nankhataiwaley-arch@github.com/...`). That also namespaces the
stored token, so authenticating it never touches the other account's credential.
`branch.main.remote` is set to `deploy`, so Cursor's own Push button targets the
right remote.

**Measure unpushed work against `deploy/main`, not `origin/main`.** `origin` is
the same repository without the username, its tracking ref goes stale, and
`git rev-list origin/main..main` will happily overstate by a dozen commits.

**A push cannot be started from an agent shell.** `GIT_ASKPASS` points at Cursor's
helper, which returns 401 when invoked from a subprocess; unset it and Git falls
through to a terminal prompt, and there is no TTY (`/dev/tty: No such device`).
Credential Manager's GUI does not appear either. Don't burn turns re-trying — the
push has to be started by the user, from Cursor's Source Control panel or a
terminal opened outside Cursor. Once a token is stored under the
`nankhataiwaley-arch@github.com` key it is remembered and later pushes work
unattended. Never ask for the token in chat, and never write it into a remote URL.

Every asset path in `index.html` is relative (`assets/...`, `public/...`), which keeps
the site working whether it's served from a repo subpath
(`user.github.io/RepoName/`) or a root user-site (`user.github.io/`). Don't introduce
leading-slash absolute paths — they break the subpath case.

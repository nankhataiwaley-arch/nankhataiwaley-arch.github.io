# Nan Khatai Waley — Website

A static brand and product showcase site for a homemade Nan Khatai business.

Built with plain **HTML5, CSS3 and JavaScript** — no framework, no build step,
no dependencies. It deploys to GitHub Pages exactly as it is.

> **There is no online ordering.** By design, the site has no cart, checkout,
> payment, accounts or order form. Every call to action points the visitor to
> **WhatsApp** or **Instagram**, where the real conversation happens.

---

## 1. How to install

Nothing to install. There are no dependencies.

```bash
git clone https://github.com/YOUR-USERNAME/NanKhataiWaley.git
cd NanKhataiWaley
```

## 2. How to run it locally

**The simplest way:** double-click `index.html`. It opens in your browser and
works completely — the site is written so it runs from the file system.

**With a local server** (closer to how it behaves once published):

```bash
npm run dev
```

That runs `npx serve .` and prints a `http://localhost:3000` address.
Any static server works — for example `python -m http.server`.

## 3. How to change the business information

Open **`assets/js/config.js`**. It is the only file you need for this:

```js
window.BUSINESS = {
  name:            "Nan Khatai Waley",
  tagline:         "Traditional Nan Khatai, baked fresh and made with love.",
  whatsapp:        "920000000000",          // digits only
  whatsappDisplay: "+92 300 000 0000",      // how it appears on screen
  whatsappMessage: "Hi! I would like to order Nan Khatai.",
  instagram:       "your_instagram_username", // no "@"
  city:            "Your City",
  hours:           "Mon – Sat, 10 AM – 8 PM"
};
```

Every WhatsApp button, Instagram link, brand name and contact detail on the page
reads from this file.

### The WhatsApp number format matters

Digits only — no `+`, no spaces, no leading zero, country code included.

| Your number | What to write |
|---|---|
| 0300 1234567 (Pakistan) | `923001234567` |
| 07700 900123 (UK) | `447700900123` |
| (555) 123-4567 (US) | `15551234567` |

### One thing config.js does not cover

The brand name also appears in the `<title>` and the `<meta>` / Open Graph tags
at the top of `index.html`. Those are what Google and WhatsApp link previews
read, so update them there too.

## 4. How to replace the images

Drop your photos into `public/images/`, using these exact filenames and the site
picks them up with no code changes:

```
public/images/
├── hero/
│   └── hero-nan-khatai.jpg          800 × 800   the main hero photo
├── products/
│   ├── classic-nan-khatai.jpg       500 × 400
│   ├── elaichi-nan-khatai.jpg       500 × 400
│   ├── pista-badam-nan-khatai.jpg   500 × 400
│   ├── nariyal-nan-khatai.jpg       500 × 400
│   ├── chocolate-nan-khatai.jpg     500 × 400
│   └── nan-khatai-gift-box.jpg      500 × 400
├── story/
│   ├── brand-intro.jpg              700 × 560
│   └── brand-story.jpg              640 × 780   portrait
├── instagram/
│   └── ig-1.jpg … ig-6.jpg          400 × 400   square
└── logo/
```

**Until a photo is added**, that slot shows a warm gradient tile with an emoji
instead of a broken image, so the page always looks finished.

A few notes:

- The sizes above are a guide for the *shape* — larger is fine, the CSS crops to fit.
- **Compress before uploading.** Aim for under ~200 KB each; [Squoosh](https://squoosh.app)
  does this in the browser for free. Large photos are the fastest way to make the site slow.
- If you change a filename, update the matching `src` in `index.html`.
- **Update the `alt` text too** when you swap a photo — it describes the image for
  screen readers and for Google.

## 5. How to build it

There is no build step. `npm run build` exists only to say so.
What is in the folder is what gets published.

## 6. How to deploy it

### GitHub Pages (free, no domain needed)

1. Push the project to a **public** GitHub repository.
2. In the repo, go to **Settings → Pages**.
3. Under *Build and deployment*: **Source** = `Deploy from a branch`,
   **Branch** = `main`, folder = `/ (root)`. Click **Save**.
4. Wait about a minute, then open
   `https://YOUR-USERNAME.github.io/NanKhataiWaley/`

Every `git push` after that updates the live site automatically.

**Want the shorter address?** Rename the repository to
`YOUR-USERNAME.github.io` and the site serves from `https://YOUR-USERNAME.github.io/`
with no folder in the path.

### Netlify or Vercel

Both work with no configuration — connect the repository, leave the build
command empty and set the publish directory to `/`.

---

## Editing the content

| What you want to change | Where |
|---|---|
| Business name, WhatsApp, Instagram, city, hours | `assets/js/config.js` |
| Page title, meta description, social preview | top of `index.html` |
| Product names, descriptions, box sizes | the `<article class="card">` blocks in `index.html` |
| Our Story text | the `#story` section in `index.html` (marked `EDITABLE`) |
| Why Choose Us claims | the `#why` section in `index.html` |
| Colours, fonts, spacing | the `:root` tokens at the top of `assets/css/base.css` |

### Before you go live, check the claims are true

The "Why Choose Us" section and the product descriptions ship with sensible
defaults — *Homemade*, *Freshly Baked*, *Made to Order*. Only keep the ones that
are genuinely true for the business, and rewrite the Our Story section in the
owner's own words. It reads as far more convincing than anything generic.

---

## Project structure

```
.
├── index.html              the whole page
├── assets/
│   ├── css/
│   │   ├── base.css        design tokens, reset, typography, animations
│   │   ├── layout.css      navbar, grids, footer, mobile sticky bar
│   │   ├── components.css  buttons, cards, media frames
│   │   └── sections.css    hero, products, story, Instagram, CTA
│   └── js/
│       ├── config.js       ← business details live here
│       └── main.js         nav, scroll reveal, image fallbacks
├── public/images/          your photography
├── .nojekyll               tells GitHub Pages to serve files as-is
├── package.json
└── README.md
```

## What is included

- Sticky navbar with an accessible hamburger menu on mobile
- Hero with fade-in entrance and a subtle parallax on the photo
- Product cards with hover lift and smooth image zoom
- Scroll-reveal animations on every section (disabled automatically for
  visitors who ask for reduced motion)
- Static Instagram-style gallery — no API, nothing to break
- Mobile-only sticky WhatsApp / Instagram bar
- SEO: title, meta description, Open Graph tags, semantic headings, alt text, favicon
- Accessibility: skip link, keyboard navigation, visible focus rings, ARIA labels
- Fully responsive with no horizontal scrolling

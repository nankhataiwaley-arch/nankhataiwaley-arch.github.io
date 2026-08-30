# Nan Khatai Waley

A single-page website for a handmade nan khatai business, built as plain HTML + CSS
so it can be hosted free on **GitHub Pages** — no hosting bill, no domain purchase.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole page (hero, flavours, story, ordering) |
| `styles.css` | All styling |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

## Before you share the link — replace the placeholders

1. **WhatsApp number** — in `index.html`, find `wa.me/920000000000`.
   Replace `920000000000` with your number in international format, no `+` and no spaces.
   Example: Pakistani number `0300 1234567` becomes `923001234567`.

2. **Email** — find `hello@example.com` and put your real address.

3. **Prices and flavours** — all inside the `<article class="card">` blocks.

4. **Delete the reminder line** — remove the `<p class="fineprint">…</p>` line once done.

## Preview locally

Just double-click `index.html`. That's it — no build step, no npm.

## Publishing (GitHub Pages)

Once the repo is pushed to GitHub:

1. Go to the repo → **Settings** → **Pages**
2. Under *Build and deployment*, set **Source** = `Deploy from a branch`
3. Branch = `main`, folder = `/ (root)` → **Save**
4. Wait ~1 minute, then load `https://YOUR-USERNAME.github.io/NanKhataiWaley/`

Every `git push` after that updates the live site automatically.

## Updating the site later

```bash
git add -A
git commit -m "Update prices"
git push
```

## Want a shorter URL?

Rename the repo to `YOUR-USERNAME.github.io` and the site serves from
`https://YOUR-USERNAME.github.io/` with no folder path.

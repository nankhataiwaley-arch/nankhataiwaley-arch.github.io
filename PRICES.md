# Held-back prices

Prices for the varieties marked **Coming soon**, taken off their cards on
2026-09-19 until they launch. They were live on the site before that, in
commit `81d49ed`.

| Variety | Starting price | Box sizes |
|---|---|---|
| Multi-Seed Nan Khatai | Rs 450 | 250 g · 500 g · 1 kg |
| Elaichi Nan Khatai | Rs 400 | 250 g · 500 g · 1 kg |
| Pista Badam Nan Khatai | Rs 950 | 250 g · 500 g · 1 kg |
| The Mixed Box | Rs 1500 | 500 g · 1 kg |

Currently live, for reference: Almond Rs 550, Chocolate Chip Rs 550.

## Launching a variety

On its card in `index.html`:

1. Replace `<p class="card__teaser">…</p>` with
   `<p class="card__price">Starting From Rs ___</p>`.
2. Remove `card--soon` from the `<article>` and delete the
   `<span class="tag">Coming soon</span>`.
3. Add the WhatsApp link back under `.card__size`:

   ```html
   <a class="card__cta" data-link="whatsapp" target="_blank" rel="noopener">
     Order via WhatsApp <span aria-hidden="true">→</span>
   </a>
   ```

4. Move its row out of the table above, and update the section subhead
   ("Almond and Chocolate Chip are baked to order today…").

Check the price with the owner first — these may have changed since.

Note: this file is public. The repo is, and Pages serves it at `/PRICES.md`.

# Just Like Home by Nicole

Static marketing site (2 pages) for *Just Like Home by Nicole* — dog walking,
sitting, boarding & day care across Sydney's Eastern Suburbs.

- `index.html` — home
- `contact.html` — booking enquiry form + FAQ
- `css/`, `js/`, `assets/photos/` — styles, scripts, images
- No build step. Pure HTML/CSS/JS.

## Preview locally
```bash
python3 serve.py   # → http://localhost:4610
```

## Deploy on GitHub Pages
1. Create a repo and push these files (see below).
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** → `main` / `/ (root)`.
3. `.nojekyll` is included so the `css/`, `js/`, `assets/` folders are served as-is.

## Before going live — swap these placeholders
- `[INSTAGRAM]` — Nicole's real Instagram handle (in nav, footer, reviews link).
- `[EMAIL]` — where the enquiry form should send (see below).
- **Reviews** — 3 placeholder quotes on the home page; replace with real ones from
  Nicole's IG highlights.

## Wiring the enquiry form
The form is currently front-end only (shows a friendly confirmation). To make it
send, add a free form endpoint (e.g. Formspree) to `#enquiryForm` in `contact.html`
and point it at Nicole's email. The "Text Nicole" buttons already work via `sms:`.

Built by Elsio.

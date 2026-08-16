# Just Like Home by Nicole

Static marketing site (2 pages) for *Just Like Home by Nicole*: dog walking,
sitting, boarding and day care across Sydney's Eastern Suburbs.

- `index.html` home
- `contact.html` booking enquiry form and FAQ
- `css/`, `js/`, `assets/photos/` styles, scripts, images
- No build step. Plain HTML, CSS and JS. Font is Arial throughout.

## Preview locally
```bash
python3 serve.py   # http://localhost:4610
```

## Deploy on GitHub Pages
1. Create a repo and push these files.
2. Repo Settings, Pages, Source: Deploy from a branch, `main`, `/ (root)`.
3. `.nojekyll` is included so the `css/`, `js/`, `assets/` folders are served as-is.

## The enquiry form
The form opens the visitor's email app pre-filled to `jlh.petservice@gmail.com`,
so it works with no backend. The "Text Nicole" buttons use `sms:`. To switch to a
hosted form later (e.g. Formspree), point the `<form>` action at the endpoint and
remove the submit handler in `js/main.js`.

## Content
Instagram: `@just_like_home_by_nicole_`. Reviews on the home page are real, pulled
from Nicole's Instagram highlights.

Built by Elsio.

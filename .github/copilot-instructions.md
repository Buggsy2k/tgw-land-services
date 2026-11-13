# TGW Land Services — project guide for AI agents

Static marketing site (5 pages) for a land-services company, generated from a Node build
script, hosted on Cloudflare Workers static assets, with a contact form that emails through a
separate Cloudflare Worker. No database, no framework, no analytics.

## Golden rule: edit the source, not the output

- **Source of truth:** `assets/` (CSS/JS), `tools/build.mjs` (page templates + content).
- **Generated, do NOT hand-edit:** everything under `site/` (HTML + copied `site/assets/`). It is
  overwritten by `npm run build`. Editing `site/` directly will be lost on the next build.
- After changing any source, run `npm run build` to regenerate `site/`.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dev deps (`sharp`, `playwright`, `wrangler`). |
| `npm run build` | Generate `site/` from `tools/build.mjs` + `assets/`. Reads photos + logo from the **parent** folder. |
| `npm start` | Serve `site/` at http://127.0.0.1:4173 (also the "Preview TGW website" task). |
| `npm test` | Playwright asset/page checks. Requires the preview running and `npx playwright install chromium`. |
| `npm run deploy` | Build, then incrementally copy `site/` to `W:\TGWLS` (`tools/deploy.mjs`, only changed files). |
| `npm run publish` | Build, `git add -A`, commit, and push (`tools/publish.mjs`). Pushing triggers the live site deploy. |

## Hosting & deploy (Cloudflare)

- **Repo:** `github.com/Buggsy2k/tgw-land-services`, branch `main`.
- **Live site:** Cloudflare Workers Builds auto-deploys `site/` on every push to `main`
  (`wrangler.jsonc` at repo root: worker `tgw-land-services`, assets `./site`).
- **Domain:** `tgwlandservices.com` + `www.tgwlandservices.com` (HTTPS via Cloudflare).
- **Cloudflare account:** `Tgwlandservice@gmail.com` — account id `d6ee058c8555d18e68f6b47ba19c95a6`,
  zone id `f395ce7ba48ffc2cba8c9c961ab36bfe`.
- Wrangler is authenticated as `buggsy2k@gmail.com` (has access to that account). For `cf`/wrangler
  commands targeting the right account, set `$env:CLOUDFLARE_ACCOUNT_ID='d6ee058c8555d18e68f6b47ba19c95a6'`.
- There is a harmless duplicate unconfigured zone under a second account — ignore it.

## Contact form email system

Flow: **browser form → Cloudflare Turnstile → `contact-form` Worker → email to inbox**, with a
**mailto fallback** if any step fails.

- **Frontend:** `assets/js/contact.js` + `assets/js/contact-config.js`. Config fields:
  - `emailEndpoint: '/api/contact'` — empty string disables the Worker path (form then only opens
    the visitor's email app).
  - `turnstileSiteKey` — public Turnstile sitekey; empty hides the widget and skips the check.
  - Behavior: on submit, POST JSON `{subject, body, from_name, from_email, turnstile_token}` to the
    endpoint; success (`{success:true}`) resets the form; **any failure falls back to the mailto draft.**
- **Worker:** `contact-form-worker/` (own `wrangler.jsonc`, deployed **separately** from the site —
  pushing does NOT redeploy it). Deploy with:
  ```pwsh
  Push-Location contact-form-worker; npx wrangler deploy; Pop-Location
  ```
  - Binding `EMAIL` (Cloudflare Email send) → `tgwlandservice@gmail.com`; from `contact@tgwlandservices.com`.
  - Routes: `tgwlandservices.com/api/contact*` and `www.tgwlandservices.com/api/contact*`.
  - Verifies Turnstile only when the `TURNSTILE_SECRET` secret is set (graceful no-op otherwise).
- **Secrets:** `TURNSTILE_SECRET` is stored in Cloudflare (`npx wrangler secret put TURNSTILE_SECRET`),
  **never** in the repo. Never print, commit, or route secret values through files or prompts.
- **Email Routing** must have the destination address verified (Cloudflare → Email → Destination
  addresses). If unverified, the Worker returns 500 and the form falls back to mailto.
- **Turnstile widget** was created via `cf turnstile widgets create` (managed mode) for the two prod
  domains plus `localhost`/`127.0.0.1` for local preview.

### Quick health checks

- Tokenless POST should return **403** (verification active):
  ```pwsh
  Invoke-WebRequest -Uri 'https://tgwlandservices.com/api/contact' -Method POST `
    -ContentType 'application/json' -Body '{"subject":"x","body":"y"}' -UseBasicParsing
  ```
- Full end-to-end requires a real browser (Turnstile token). Submitting the live form should show
  "Message sent." and deliver an email. Trace with `npx wrangler tail contact-form`.

## Photos

`tools/build.mjs` recursively reads the **sibling** `../images/` folder and the logo
`../TGW Logo cleaner.png` from the parent of the repo. It emits WebP thumbnails/display images and a
manifest into `site/assets/images/`. The home hero uses `assets/images/mainpage.png` (kept in source
`assets/images/` so rebuilds preserve it). Originals are never modified.

## Gotchas

- `tools/test.mjs` has **hardcoded photo-count assertions** that drift as the image library grows —
  they can fail even when the build is fine. Update the expected counts/folders when touching tests.
- The build reads from the parent folder; running it elsewhere (or if `../images` is missing) changes
  the photo output.
- Don't commit `node_modules/` (gitignored, including the nested one under `contact-form-worker/`).
- Keep `README.md` in sync when user-facing behavior changes.

# TGW Land Services website

Five real static pages, original company branding, project photography from every supplied image subfolder, and an email-app inquiry form. No database, backend, analytics, external fonts, or production JavaScript framework.

## Preview and development

Install the development dependencies with `npm install`. Run `npm run build`, then `npm start`, and visit http://127.0.0.1:4173. A **Preview TGW website** VS Code task is also included. While the preview is running, `npm test` performs Chromium browser and asset checks. On a new machine, install the test browser with `npx playwright install chromium`.

Edit the shared design in [assets/css/styles.css](assets/css/styles.css), page content/templates in [tools/build.mjs](tools/build.mjs), and browser behavior in [assets/js](assets/js). Rebuild after source changes; generated output is not the editing source.

## Appearance

The subtle **Appearance** selector at the bottom of the footer offers **System**, **Light**, and **Dark** on every page. System is the default and follows the device color preference, including live changes. Choose Light or Dark to test either version regardless of your device setting; return to System to follow it again. The preference is saved locally in the browser and shared across pages/tabs. If storage is blocked, the selector still works on the current page. With JavaScript disabled, the site still follows the system setting through CSS. Photos retain their original colors; the transparent logo is inverted only in dark mode for legibility.

## Publish

Upload **the contents of [site](site)** to any static hosting service. The five HTML pages and all runtime assets live there; Node and npm are development tools only. Relative links support a hosting subdirectory. Do not upload node_modules, tools, original photographs, company documents, or other parent-folder materials.

The generated pages can also be opened locally, though clipboard behavior and some browser features work better on localhost or HTTPS. There is no client-side router or hosting rewrite requirement.

## Hosting & email delivery (Cloudflare)

The live site is hosted on **Cloudflare Workers static assets** and auto-deploys from the `main`
branch of `github.com/Buggsy2k/tgw-land-services` on every push (`wrangler.jsonc` at the repo root).
`npm run publish` builds, commits, and pushes in one step. `npm run deploy` instead copies the built
`site/` to the local `W:\TGWLS` share (changed files only).

The contact form now sends email directly through a separate Cloudflare Worker
(`contact-form-worker/`), protected by **Cloudflare Turnstile**. On submit it POSTs to `/api/contact`;
if the Worker, Turnstile, or network is unavailable, the form **falls back to the original
email-app (mailto) draft** described above — so it degrades gracefully and never reports a false
delivery. The Worker is deployed independently (`cd contact-form-worker && npx wrangler deploy`);
pushing the repo does **not** redeploy it. See [.github/copilot-instructions.md](.github/copilot-instructions.md)
for account IDs, the Turnstile sitekey, secret handling, and health checks.

## Contact details — required before launch

Edit [assets/js/contact-config.js](assets/js/contact-config.js), replacing empty values with verified company email, phone, service area, and optional address; then rebuild. Keep unknown values empty. A verified email enables **Open email app**. Phone and email links appear only when configured. No fictitious contact information is published.

The form validates required fields, creates a preview, and opens an encoded mailto draft. The visitor must review and send it in their own email application. The site cannot guarantee an email handler is installed and never reports delivery. Long drafts use the copy/selection fallback rather than relying on oversized mailto URLs. Clipboard access may require HTTPS or browser permission. Nothing is sent to a server, written to local storage, or retained after the page is left.

## Photos

The build recursively reads the sibling images folder and the updated transparent logo, TGW Logo cleaner.png, from the parent folder. Logo transparency and original colors are preserved. Originals remain unchanged. Current inventory: **85 images**, comprising 9 Fence pics, 21 Mulching pics, 25 Random pics 1, and 30 Random pics 2. Every supported JPEG/JPG/PNG is included; the earlier 84-photo estimate was corrected by the recursive inventory.

The build generates auto-oriented metadata-stripped WebP thumbnails (640×480) and display images (up to 1600×1400), plus a manifest in the generated image folder. Modern Chrome, Edge, Firefox, and Safari support WebP. The logo is optimized PNG. The full photo library is approximately 11 MB; the gallery displays batches of 12, lazy-loads thumbnails, and requests large versions on demand. Stable sequential IDs avoid repeated source filename collisions, though IDs may change if the sorted inventory changes.

Photo source paths are recorded only in the image manifest for maintenance. No project names, dates, locations, or before/after pairings have been invented. The two Random folders use the neutral **Project Work** label. Generic category-based alt text is used for the full gallery; review and enrich it per image before launch if detailed descriptions are available. The contact sheet in [tools/contact-sheet.jpg](tools/contact-sheet.jpg) is a local review aid and is not published.

## Prelaunch checklist

- Confirm company copy and the six services against the supplied company document.
- Replace contact placeholders and verify the actual email recipient and telephone links.
- Review each photograph at full resolution for permission to publish, people, addresses, plates, sensitive locations, and unwanted duplicates. All supplied photos are included by default; similar shots have not been treated as before/after pairs.
- Test all five pages, filters, keyboard lightbox controls, and the form on the chosen host and actual mobile devices.
- Test the email-app workflow and copy fallback with the target devices; send a real test inquiry yourself.
- Add a real domain/canonical URL only when hosting is confirmed. No location or unverified certification claims are included.
- If adding direct email delivery later, implement an appropriately secured email endpoint/service; it is not part of this static site.
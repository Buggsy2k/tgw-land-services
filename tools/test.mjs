import assert from 'node:assert/strict';
import { readFile, readdir, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const root = path.resolve('site');
const base = 'http://127.0.0.1:4173/';
const manifest = JSON.parse(await readFile(path.join(root, 'assets/images/manifest.json'), 'utf8'));
async function sourceImages(dir) {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(e => e.isDirectory() ? sourceImages(path.join(dir, e.name)) : /\.(jpe?g|png)$/i.test(e.name) ? [path.join(dir, e.name)] : []))).flat();
}
assert.equal(manifest.length, (await sourceImages('../images')).length);
assert.equal(new Set(manifest.map(p => p.source.split('/')[0])).size, 4);
assert.equal(new Set(manifest.map(p => p.id)).size, manifest.length);
for (const photo of manifest) {
  assert.ok((await stat(path.join(root,photo.src))).size > 0);
  assert.ok((await stat(path.join(root,photo.thumb))).size > 0);
}
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
// Compare header geometry before deferred controls initialize with its final layout.
await page.route('**/assets/js/site.js', async route => {
  const response = await route.fetch();
  const script = await response.text();
  await route.fulfill({ response, body: `window.__headerBefore = [...document.querySelectorAll('.brand, #main-nav a, .menu-toggle')].map(el => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });\n${script}` });
});
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
const pages = ['index.html','about.html','services.html','gallery.html','contact.html'];
for (const colorScheme of ['light', 'dark']) {
await page.emulateMedia({ colorScheme });
for (const width of [360, 768, 1440]) {
  await page.setViewportSize({ width, height: 1000 });
  for (const name of pages) {
    await page.goto(base + name);
    assert.ok(await page.evaluate(() => {
      const after = [...document.querySelectorAll('.brand, #main-nav a, .menu-toggle')].map(el => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
      return after.every((rect, i) => rect.every((value, j) => Math.abs(value - window.__headerBefore[i][j]) < 1));
    }), `Header shifts during initialization: ${name} at ${width}`);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('.site-header #theme-choice').count(), 0);
    assert.equal(await page.locator('.site-footer #theme-choice').count(), 1);
    assert.equal(await page.locator('#main-nav [aria-current="page"]').count(), 1);
    if (width === 1440) {
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
      assert.deepEqual(accessibility.violations.map(v => ({ id: v.id, elements: v.nodes.map(n => n.target) })), [], `Accessibility issues: ${name}`);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow: ${name} at ${width}`);
    assert.equal(await page.locator('img[src]').evaluateAll(imgs => imgs.filter(i => i.complete && !i.naturalWidth).length), 0, `Broken loaded image: ${name} at ${width}`);
    const links = await page.locator('a[href]').evaluateAll(els => els.map(el => el.getAttribute('href')).filter(href => !href.startsWith('#') && !href.includes(':')));
    for (const href of links) assert.ok((await stat(path.join(root, decodeURIComponent(href.split('?')[0])))).isFile(), `Broken link ${href}`);
  }
}
}
await page.goto(base);
assert.equal(await page.locator('#theme-choice').inputValue(), 'system');
const darkColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
await page.getByRole('combobox', { name: 'Color theme' }).selectOption('light');
const lightColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
assert.notEqual(lightColor, darkColor);
await page.goto(base + 'about.html');
assert.equal(await page.locator('#theme-choice').inputValue(), 'light');
assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), lightColor);
await page.getByRole('combobox', { name: 'Color theme' }).selectOption('dark');
await page.emulateMedia({ colorScheme: 'light' });
assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), darkColor);
await page.reload();
assert.equal(await page.locator('#theme-choice').inputValue(), 'dark');
await page.getByRole('combobox', { name: 'Color theme' }).selectOption('system');
assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), lightColor);
await page.emulateMedia({ colorScheme: 'dark' });
assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), darkColor);
await page.emulateMedia({ colorScheme: 'light' });
await page.setViewportSize({ width: 360, height: 900 });
await page.goto(base);
await page.getByRole('button', { name: 'Menu' }).click();
assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
await page.keyboard.press('Escape');
assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto(base + 'gallery.html');
assert.equal(await page.locator('.gallery-item:visible').count(), 12);
await page.getByRole('button', { name: 'Load more photographs' }).click();
assert.equal(await page.locator('.gallery-item:visible').count(), 24);
await page.getByRole('button', { name: 'Fencing', exact: true }).click();
assert.equal(await page.locator('.gallery-item:visible').count(), 9);
await page.locator('.gallery-item:visible').first().click();
assert.ok(await page.locator('dialog').isVisible());
await page.keyboard.press('ArrowRight');
assert.equal(await page.locator('#photo-position').textContent(), '2 / 9');
await page.keyboard.press('Tab');
assert.ok(await page.evaluate(() => !!document.activeElement.closest('dialog')), 'Modal contains keyboard focus');
await page.keyboard.press('Escape');
assert.ok(!await page.locator('dialog').isVisible());
assert.ok(await page.locator('.gallery-item').first().evaluate(el => el === document.activeElement));
await page.getByRole('button', { name: 'Clearing & Mulching', exact: true }).click();
assert.ok((await page.locator('#gallery-count').textContent()).includes('21 photographs'));
await page.getByRole('button', { name: 'Project Work', exact: true }).click();
assert.ok((await page.locator('#gallery-count').textContent()).includes('55 photographs'));

async function fillForm(p) {
  await p.locator('[name=name]').fill("O’Brien & Sons");
  await p.locator('[name=email]').fill('customer@example.com');
  await p.locator('[name=phone]').fill('555-0101');
  await p.locator('[name=service]').selectOption('Fencing');
  await p.locator('[name=location]').fill('North & South');
  await p.locator('[name=subject]').fill('Site & fencing inquiry');
  await p.locator('[name=details]').fill('First line\nSecond line — grading & clearing');
}
// Exercise the placeholder state independently of the configured company email.
await page.route('**/contact-config.js', route => route.fulfill({ contentType: 'text/javascript', body: 'window.TGW_CONTACT = {email:"",phone:"",address:""};' }));
await page.goto(base + 'contact.html?service=Fencing');
assert.equal(await page.locator('[name=service]').inputValue(), 'Fencing');
assert.ok(await page.locator('#open-email').isDisabled());
await page.getByRole('button', { name: 'Preview draft' }).click();
assert.ok(!(await page.locator('#draft-panel').isVisible()));
await fillForm(page);
await page.locator('[name=email]').fill('invalid');
await page.getByRole('button', { name: 'Preview draft' }).click();
assert.ok(!(await page.locator('#draft-panel').isVisible()));
await page.locator('[name=email]').fill('customer@example.com');
await page.getByRole('button', { name: 'Preview draft' }).click();
assert.ok((await page.locator('#draft').inputValue()).includes('O’Brien & Sons'));
assert.ok((await page.locator('#draft').inputValue()).includes('Second line — grading & clearing'));
await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw Error('denied'); } } }));
await page.getByRole('button', { name: 'Copy draft' }).click();
assert.ok((await page.locator('#form-status').textContent()).includes('manually'));

// Test a real-contact configuration in this browser only; never edit production placeholders or send email.
await page.route('**/contact-config.js', route => route.fulfill({ contentType: 'text/javascript', body: 'window.TGW_CONTACT = {email:"inquiries@example.com",phone:"555-0100",address:"Test address"};' }));
await page.goto(base + 'contact.html');
assert.ok(await page.locator('#open-email').isEnabled());
assert.equal(await page.locator('[data-contact=email] a').getAttribute('href'), 'mailto:inquiries@example.com');
await fillForm(page);
const emailLink = await page.evaluate(() => buildEmailLink(prepare()));
const parsed = new URL(emailLink);
assert.equal(parsed.pathname, 'inquiries@example.com');
assert.equal(parsed.searchParams.get('subject'), 'Site & fencing inquiry');
for (const value of ['O’Brien & Sons','customer@example.com','555-0101','Fencing','North & South','Second line — grading & clearing']) {
  assert.ok(parsed.searchParams.get('body').includes(value), `Mailto contains ${value}`);
}
await page.locator('[name=details]').fill('Long draft '.repeat(500));
await page.locator('#open-email').click();
assert.ok((await page.locator('#form-status').textContent()).includes('too long'));

const noScript = await browser.newContext({ javaScriptEnabled: false });
const staticPage = await noScript.newPage();
await staticPage.goto(base + 'gallery.html');
assert.equal(await staticPage.locator('.gallery-item').count(), manifest.length);
assert.ok(await staticPage.locator('#main-nav').isVisible());
await noScript.close();
await mkdir('test-results', { recursive: true });
await page.goto(base);
await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
await page.setViewportSize({ width: 360, height: 900 });
await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
await browser.close();
assert.deepEqual(errors, [], 'Browser errors or missing resources');
console.log(`PASS: 5 pages × 3 viewports, ${manifest.length} photo assets, navigation, gallery, form validation, contact configuration, long-draft/copy fallback, and no-JavaScript gallery.`);
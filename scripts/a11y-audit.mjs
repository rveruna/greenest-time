// Runs axe-core (WCAG 2.0 to 2.2, A and AA rules) in a real browser against the web build, in every state
// the screen can be in: loaded (light and dark, phone and desktop, reduced motion, each duration), the best
// window being "now", a regional forecast, postcode errors, a reminder set, loading, and error. The Carbon Intensity API is replaced by fixed fake data, so the
// audit never depends on a third-party service being up. Fails on any violation.
// Usage: npm run a11y-audit   (builds first)
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const BASE_PATH = '/greenest-time'; // matches experiments.baseUrl in app.json
const root = path.resolve(import.meta.dirname, '..', 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ico': 'image/x-icon' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.startsWith(BASE_PATH)) p = p.slice(BASE_PATH.length) || '/';
  const file = path.join(root, p);
  const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(root, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(target)] ?? 'application/octet-stream' });
  fs.createReadStream(target).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}${BASE_PATH}/`;

/** 96 half-hour slots from now, in the API's shape. `shape(i)` gives the gCO2/kWh for slot i. */
function forecast(shape) {
  const start = new Date(Math.floor(Date.now() / 1800000) * 1800000);
  const index = (v) =>
    v < 60 ? 'very low' : v < 120 ? 'low' : v < 180 ? 'moderate' : v < 240 ? 'high' : 'very high';
  return {
    data: Array.from({ length: 96 }, (_, i) => {
      const from = new Date(start.getTime() + i * 1800000);
      const to = new Date(from.getTime() + 1800000);
      const v = Math.round(shape(i));
      return {
        from: from.toISOString().slice(0, 16) + 'Z',
        to: to.toISOString().slice(0, 16) + 'Z',
        intensity: { forecast: v, actual: null, index: index(v) },
      };
    }),
  };
}
const wavy = forecast((i) => 150 + 110 * Math.sin(i / 7)); // spans all five colour bands
const cleanestNow = forecast((i) => 40 + i * 2); // best window starts immediately

const API = '**/api.carbonintensity.org.uk/**';
/** Answers national requests with `body` and regional (postcode) ones with the same slots for a named region. */
const respond =
  (body, region = 'South Scotland') =>
  (route) => {
    const regional = route.request().url().includes('/regional/');
    const payload = regional
      ? { data: { regionid: 1, shortname: region, postcode: 'EH1', data: body.data } }
      : body;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  };
const unknownPostcode = (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: null }) });
const usePostcode = async (page, code) => {
  await page.getByLabel('Your postcode (optional)').fill(code);
  await page.getByRole('button', { name: 'Use postcode' }).click();
};
const ready = 'text=gCO₂/kWh';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const desktop = { viewport: { width: 1280, height: 900 } };
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

const scenarios = [
  {
    name: 'loaded, desktop, light',
    ctx: { ...desktop, colorScheme: 'light' },
    api: respond(wavy),
    wait: ready,
  },
  {
    name: 'loaded, desktop, dark',
    ctx: { ...desktop, colorScheme: 'dark' },
    api: respond(wavy),
    wait: ready,
  },
  { name: 'loaded, phone, light', ctx: { ...phone, colorScheme: 'light' }, api: respond(wavy), wait: ready },
  { name: 'loaded, phone, dark', ctx: { ...phone, colorScheme: 'dark' }, api: respond(wavy), wait: ready },
  {
    name: 'loaded, reduced motion',
    ctx: { ...phone, reducedMotion: 'reduce' },
    api: respond(wavy),
    wait: ready,
  },
  {
    name: 'loaded, 4 hours selected',
    ctx: phone,
    api: respond(wavy),
    wait: ready,
    setup: async (page) => {
      await page.getByRole('radio', { name: '4 hours' }).click();
      await page.waitForTimeout(1200);
    },
  },
  { name: 'best time is now', ctx: phone, api: respond(cleanestNow), wait: 'text=Now is the best time' },
  {
    name: 'regional forecast (postcode set)',
    ctx: phone,
    api: respond(wavy),
    wait: ready,
    setup: async (page) => {
      await usePostcode(page, 'EH1 1AA');
      await page.waitForSelector('text=Showing South Scotland');
      await page.waitForTimeout(1200);
    },
  },
  {
    name: 'postcode typed wrong (inline error), dark',
    ctx: { ...phone, colorScheme: 'dark' },
    api: respond(wavy),
    wait: ready,
    setup: async (page) => {
      await usePostcode(page, 'hello');
      await page.waitForSelector("text=doesn't look like a UK postcode");
    },
  },
  {
    name: 'unknown postcode (API has no forecast)',
    ctx: phone,
    api: respond(wavy),
    wait: ready,
    setup: async (page) => {
      await page.unroute(API);
      await page.route(API, unknownPostcode);
      await usePostcode(page, 'ZZ9');
      await page.waitForSelector('text=No forecast for ZZ9');
    },
  },
  {
    name: 'reminder added (web: calendar file), dark',
    ctx: { ...desktop, colorScheme: 'dark' },
    api: respond(wavy),
    wait: ready,
    setup: async (page) => {
      await page.getByRole('button', { name: 'Add to calendar' }).click();
      await page.waitForSelector('text=Calendar event downloaded');
    },
  },
  {
    name: 'loading, light',
    ctx: { ...phone, colorScheme: 'light' },
    api: () => {},
    wait: 'text=Loading the 48-hour forecast',
  },
  {
    name: 'loading, dark',
    ctx: { ...phone, colorScheme: 'dark' },
    api: () => {},
    wait: 'text=Loading the 48-hour forecast',
  },
  {
    name: 'error, light',
    ctx: { ...phone, colorScheme: 'light' },
    api: (r) => r.abort(),
    wait: 'text=Try again',
  },
  {
    name: 'error, dark',
    ctx: { ...phone, colorScheme: 'dark' },
    api: (r) => r.abort(),
    wait: 'text=Try again',
  },
];

const browser = await chromium.launch();
let violations = 0;

for (const s of scenarios) {
  const context = await browser.newContext({ ...s.ctx, acceptDownloads: true });
  const page = await context.newPage();
  await page.route(API, s.api);
  await page.goto(url);
  await page.waitForSelector(s.wait, { timeout: 15000 });
  await page.waitForTimeout(1200); // let the card entrance and the bars finish animating
  await s.setup?.(page);
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  violations += results.violations.length;
  console.log(`${results.violations.length === 0 ? 'PASS' : 'FAIL'}  ${s.name}`);
  for (const v of results.violations) {
    console.log(
      `   - ${v.id}: ${v.help} [${v.impact}] (${v.nodes.length} element${v.nodes.length === 1 ? '' : 's'})`,
    );
    for (const n of v.nodes.slice(0, 3)) console.log(`       ${n.target.join(' ')}`);
  }
  await context.close();
}

await browser.close();
server.close();
console.log(`\n${violations} violations across ${scenarios.length} scenarios`);
process.exit(violations === 0 ? 0 : 1);

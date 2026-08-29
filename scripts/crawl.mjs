/**
 * Route crawl: every primary route, at a phone width and a desktop width.
 *
 * Checks the four things that are cheap to break and expensive to miss — a
 * non-200, a console error, a failed subresource, and horizontal scroll.
 *
 * The overflow check asks whether the page ACTUALLY scrolls sideways, rather
 * than reading `documentElement.scrollWidth`. That property lies here:
 * `body { overflow-x: hidden }` propagates to the viewport, so scrollWidth
 * reports the unclipped content on pages that cannot scroll at all. It
 * produced two false alarms before it was caught.
 *
 *   npm run build && npx next start -p 3111
 *   node scripts/crawl.mjs
 */
// Playwright is not a dependency of the app; point at wherever it is installed.
const { chromium } = await import(process.env.PLAYWRIGHT_PATH ?? "playwright");
const ROUTES = ["/", "/shop", "/shop/scarred", "/shop/statement", "/product/scarred-hoodie", "/product/actively-tee",
  "/product/c4-pre-workout", "/product/ch-crop-set", "/bundles", "/checkout", "/method", "/train", "/fuel",
  "/community", "/journal", "/journal/sleep-is-the-training-variable", "/fit", "/wishlist", "/account", "/about"];
const b = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
let bad = 0;
for (const w of [390, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
  for (const r of ROUTES) {
    const errs = [], net = [];
    const p = await ctx.newPage();
    p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    p.on("pageerror", (e) => errs.push("PAGEERROR " + e.message));
    p.on("response", (res) => { if (res.status() >= 400) net.push(res.status() + " " + res.url()); });
    const resp = await p.goto("http://localhost:3111" + r, { waitUntil: "networkidle" }).catch((e) => { errs.push("NAV " + e.message); return null; });
    await p.waitForTimeout(400);
    const scrolls = await p.evaluate(() => { window.scrollTo(2000, 0); const x = window.scrollX; window.scrollTo(0, 0); return x; });
    const st = resp ? resp.status() : 0;
    const ok = st === 200 && errs.length === 0 && net.length === 0 && scrolls === 0;
    if (!ok) { bad++; console.log(`FAIL ${w} ${r} status=${st} scrollX=${scrolls}`, errs.slice(0,3), net.slice(0,3)); }
    await p.close();
  }
  await ctx.close();
}
await b.close();
console.log(bad === 0 ? `CLEAN: ${ROUTES.length} routes x 2 widths` : `${bad} failures`);

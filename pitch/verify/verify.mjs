/* Lærling landingsside — repeterbar selvverifisering.
   Kjør:  cd pitch/verify && npm install && npm run verify
   Gjør:  1) skjermbilder 1440/834/390  2) axe-core (a11y)  3) Lighthouse (perf)
          4) OG-bilde (1200×630)  — rapporter i pitch/rapporter/ */
import { chromium } from "playwright-core";
import http from "http";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const PITCH = path.resolve(process.cwd(), "..");
const SKJERM = path.join(PITCH, "skjermbilder");
const RAPPORT = path.join(PITCH, "rapporter");
const KROM = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";
const GL = ["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--use-gl=angle"];
const MIME = { ".html":"text/html", ".png":"image/png", ".json":"application/json", ".js":"text/javascript" };

await mkdir(SKJERM, { recursive: true });
await mkdir(RAPPORT, { recursive: true });

const server = http.createServer(async (req, res) => {
  let p = req.url.split("?")[0];
  if (req.method === "POST") { res.statusCode = 200; res.end("ok"); return; }   /* skjema-mock */
  if (p === "/") p = "/landing.html";
  try {
    const fil = path.join(PITCH, p);
    res.setHeader("content-type", MIME[path.extname(fil)] || "text/plain");
    res.end(await readFile(fil));
  } catch { res.statusCode = 404; res.end("404"); }
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;
const URL_ = `http://localhost:${port}/`;
const browser = await chromium.launch({ executablePath: KROM, args: GL });
const feil = [];

/* ── 1. skjermbilder ─────────────────────────────────────────── */
for (const [navn, vp] of [["desktop-1440",{width:1440,height:900}],
                          ["nettbrett-834",{width:834,height:1112}],
                          ["mobil-390",{width:390,height:844}]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
  const side = await ctx.newPage();
  side.on("pageerror", e => feil.push(`JS-feil (${navn}): ${e.message}`));
  side.on("console", m => { if (m.type() === "error") feil.push(`Konsollfeil (${navn}): ${m.text()}`); });
  await side.goto(URL_, { waitUntil: "networkidle" });
  await side.waitForTimeout(1200);
  /* rull gjennom så alle IO-avsløringer utløses, så tilbake til topp */
  await side.evaluate(async () => {
    const steg = Math.ceil(document.body.scrollHeight / 600);
    for (let i = 0; i <= steg; i++) { window.scrollTo(0, i * 600); await new Promise(r => setTimeout(r, 90)); }
    document.querySelectorAll(".avslør").forEach(e => e.classList.add("inne"));
    window.scrollTo(0, 0);
  });
  await side.waitForTimeout(900);
  await side.screenshot({ path: path.join(SKJERM, `${navn}-hero.png`) });
  /* seksjonsvise element-skudd — fullPage stitcher feil når sider har faste lag */
  for (const [sel, fil] of [["#jobbene","jobbene"],["#appen","appen"],["#beviset","beviset"],
                            ["#tillit","tillit"],["#priser","priser"],[".slutt","slutt"]]) {
    const el = await side.$(sel);
    if (el) await el.screenshot({ path: path.join(SKJERM, `${navn}-${fil}.png`) }).catch(()=>{});
  }
  await ctx.close();
  console.log("✓ skjermbilder " + navn);
}

/* ── 2. axe-core ─────────────────────────────────────────────── */
const axeKilde = await readFile(path.resolve("node_modules/axe-core/axe.min.js"), "utf8");
const ctxA = await browser.newContext({ viewport: {width:1440,height:900} });
const sideA = await ctxA.newPage();
await sideA.goto(URL_, { waitUntil: "networkidle" });
/* la avsløringene fullføre — ellers måler axe kontrast på halvgjennomsiktige elementer */
await sideA.evaluate(() => document.querySelectorAll(".avslør").forEach(e => e.classList.add("inne")));
await sideA.waitForTimeout(1100);
await sideA.addScriptTag({ content: axeKilde });
const axe = await sideA.evaluate(async () => await window.axe.run(document, { resultTypes: ["violations"] }));
await ctxA.close();
const kritiske = axe.violations.filter(v => v.impact === "critical" || v.impact === "serious");
await writeFile(path.join(RAPPORT, "a11y.json"), JSON.stringify(axe.violations, null, 1));
console.log(`✓ axe-core: ${axe.violations.length} avvik (${kritiske.length} kritiske/alvorlige)`);
axe.violations.forEach(v => console.log(`   – [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`));
if (kritiske.length) feil.push(`axe: ${kritiske.length} kritiske/alvorlige avvik`);

/* ── 3. Lighthouse (egen chromium med feilsøkingsport) ─────── */
let lhOk = false;
try {
  const { default: lighthouse } = await import("lighthouse");
  const lhBrowser = await chromium.launch({ executablePath: KROM,
    args: [...GL, "--remote-debugging-port=9222"] });
  const res = await lighthouse(URL_, { port: 9222, output: "json", logLevel: "error",
    onlyCategories: ["performance","accessibility","best-practices","seo"],
    formFactor: "desktop",
    screenEmulation: { mobile:false, width:1440, height:900, deviceScaleFactor:1, disabled:false },
    throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } });
  const lh = res.lhr;
  const tall = (k) => Math.round(lh.categories[k].score * 100);
  await writeFile(path.join(RAPPORT, "lighthouse.json"), JSON.stringify({
    performance: tall("performance"), accessibility: tall("accessibility"),
    bestPractices: tall("best-practices"), seo: tall("seo"),
    metrics: { fcp: lh.audits["first-contentful-paint"].displayValue,
      lcp: lh.audits["largest-contentful-paint"].displayValue,
      cls: lh.audits["cumulative-layout-shift"].displayValue,
      tbt: lh.audits["total-blocking-time"].displayValue }
  }, null, 1));
  console.log(`✓ Lighthouse: perf ${tall("performance")} · a11y ${tall("accessibility")} · beste praksis ${tall("best-practices")} · seo ${tall("seo")}`);
  console.log(`   FCP ${lh.audits["first-contentful-paint"].displayValue} · LCP ${lh.audits["largest-contentful-paint"].displayValue} · CLS ${lh.audits["cumulative-layout-shift"].displayValue} · TBT ${lh.audits["total-blocking-time"].displayValue}`);
  if (tall("performance") < 90) feil.push(`Lighthouse performance ${tall("performance")} < 90`);
  if (tall("accessibility") < 95) feil.push(`Lighthouse accessibility ${tall("accessibility")} < 95`);
  lhOk = true;
  await lhBrowser.close();
} catch (e) {
  console.log("… Lighthouse hoppet over: " + String(e.message || e).split("\n")[0]);
}

/* ── 4. OG-bilde ─────────────────────────────────────────────── */
const ctxO = await browser.newContext({ viewport: {width:1200,height:630}, deviceScaleFactor: 1 });
const sideO = await ctxO.newPage();
await sideO.goto(`${URL_}verify/og-kort.html`, { waitUntil: "networkidle" });
await sideO.screenshot({ path: path.join(PITCH, "og-laerling.png") });
await ctxO.close();
console.log("✓ OG-bilde skrevet (pitch/og-laerling.png)");

await browser.close(); server.close();
if (feil.length) { console.error("\nFEIL:\n" + feil.map(f => " – " + f).join("\n")); process.exit(1); }
console.log("\nVERIFISERING GRØNN");

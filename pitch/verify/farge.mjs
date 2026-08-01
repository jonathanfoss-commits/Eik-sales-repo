import { chromium } from "playwright-core";
import http from "http"; import { readFile } from "fs/promises"; import path from "path";
const R = "/home/user/Eik-sales-repo/pitch";
const s = http.createServer(async (q,r)=>{ let p=q.url.split("?")[0]; if(p==="/")p="/landing.html";
  try{ r.setHeader("content-type","text/html"); r.end(await readFile(path.join(R,p))); }catch{ r.statusCode=404; r.end("x"); }});
await new Promise(r=>s.listen(0,r)); const port=s.address().port;
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium",
  args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const tema of ["lys","mørk"]) {
  const c = await b.newContext({ viewport:{width:1440,height:900} });
  const p2 = await c.newPage();
  await p2.goto(`http://localhost:${port}/`, { waitUntil:"networkidle" });
  await p2.evaluate(t => { document.documentElement.setAttribute("data-tema",t);
    document.querySelectorAll(".avslør").forEach(e=>e.classList.add("inne")); }, tema);
  await p2.waitForTimeout(1400);
  const ut = await p2.evaluate(() => {
    const g = (sel) => { const e = document.querySelector(sel); if(!e) return null;
      const cs = getComputedStyle(e); return { farge: cs.color, opacity: cs.opacity, bak: cs.backgroundColor }; };
    return { etikett: g("#jobbene .etikett"), avsnitt: g(".seksjonstopp p.avslør"), seksjon: g("#jobbene") };
  });
  console.log(tema, JSON.stringify(ut));
  await c.close();
}
await b.close(); s.close();

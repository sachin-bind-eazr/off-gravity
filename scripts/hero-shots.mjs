// Hero QA: node scripts/hero-shots.mjs <outDir> [baseUrl]
import { chromium } from "@playwright/test";
const out = process.argv[2], base = process.argv[3] ?? "http://localhost:3101";
const sizes = [[1920,1080],[1440,900],[1280,800],[1024,768],[768,1024],[390,844],[375,812],[320,568]];
const b = await chromium.launch();
for (const [w,h] of sizes) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w > 700 ? 1 : 2 });
  const errs = []; p.on("console", m => m.type() === "error" && errs.push(m.text())); p.on("pageerror", e => errs.push(String(e)));
  await p.goto(base + "/", { waitUntil: "networkidle" });
  await p.addStyleTag({ content: ".hero-push{animation:none!important}" });
  await p.waitForTimeout(300);
  const m = await p.evaluate(() => {
    const hero = document.querySelector(".og-hero").getBoundingClientRect();
    const nav = document.querySelector("header").getBoundingClientRect();
    const strip = document.querySelector(".og-hero__strip").getBoundingClientRect();
    const img = document.querySelector(".og-hero__art img");
    return { overflow: document.documentElement.scrollWidth > innerWidth, navH: nav.height, heroH: Math.round(hero.height), stripBottom: Math.round(strip.bottom), vh: innerHeight, imgNatural: img.naturalWidth + "x" + img.naturalHeight, imgCss: Math.round(img.getBoundingClientRect().width) + "x" + Math.round(img.getBoundingClientRect().height), h1w: Math.round(document.querySelector("h1").getBoundingClientRect().right) };
  });
  console.log(`${w}x${h}`, JSON.stringify(m), errs.length ? "ERR " + errs.join("|") : "console-clean");
  await p.screenshot({ path: `${out}/hero-${w}x${h}.png` });
  await p.close();
}
await b.close();

// Usage: node scripts/video-frames.mjs <dir with best1.png..best8.png>
import sharp from "sharp"; import fs from "node:fs";
const dir = process.argv[2]; const out = "public/images/teaser"; fs.mkdirSync(out, { recursive: true });
const sizes = [];
for (let i = 1; i <= 8; i++) {
  const n = String(i).padStart(2, "0");
  const base = sharp(`${dir}/best${i}.png`).resize({ width: 1920, kernel: "lanczos3" }).sharpen({ sigma: 1.1, m1: 0.8, m2: 1.6 }).modulate({ saturation: 1.04 });
  const meta = await base.clone().toBuffer({ resolveWithObject: true });
  await base.clone().jpeg({ quality: 88, mozjpeg: true }).toFile(`${out}/frame-${n}.jpg`);
  await base.clone().webp({ quality: 84 }).toFile(`${out}/frame-${n}.webp`);
  await base.clone().avif({ quality: 60, effort: 4 }).toFile(`${out}/frame-${n}.avif`);
  sizes.push({ n: i, w: meta.info.width, h: meta.info.height });
}
console.log(JSON.stringify(sizes));

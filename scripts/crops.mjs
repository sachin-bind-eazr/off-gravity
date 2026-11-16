// Best-effort raster crops from the 709x945 poster: light denoise + Lanczos3 upscale + unsharp.
// Usage: node scripts/crops.mjs
import sharp from "sharp";
const src = "public/assets/art/campaign-poster.jpg", out = "public/assets/art/";
const CROPS = { // name: [left, top, right, bottom, scale]
  "hero-course": [0, 364, 709, 846, 3],
  "race-climber": [0, 250, 180, 470, 4],
  "athlete-arch": [560, 330, 709, 700, 4],
  "slider": [150, 370, 340, 540, 4],
  "runners": [200, 540, 620, 800, 4],
  "tunnel": [470, 350, 709, 640, 4],
};
for (const [n, [l, t, r, b, s]] of Object.entries(CROPS)) {
  const w = r - l, h = b - t;
  const base = sharp(src).extract({ left: l, top: t, width: w, height: h }).median(3)
    .resize(w * s, h * s, { kernel: "lanczos3" }).sharpen({ sigma: 1.6, m1: 1.2, m2: 2.5 });
  await base.clone().webp({ quality: 92 }).toFile(out + n + ".webp");
  await base.clone().jpeg({ quality: 92, mozjpeg: true }).toFile(out + n + ".jpg");
  console.log(n, w * s + "x" + h * s);
}

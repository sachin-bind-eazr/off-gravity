// Story panels 01-03: crop to 16:10, mild warm-daylight grade, export q82 progressive + 1000px -sm.
// Usage: node scripts/story-photos.mjs <dir-with-originals p<ID>.jpg>
import sharp from "sharp";
const dir = process.argv[2];
const P = [ // id, slug, crop [left, top, width, height] in source px
  [3764011, "01-timed-racing", [0, 120, 2400, 1500]],
  [3763870, "02-live-leaderboards", [0, 103, 2400, 1500]],
  [32575092, "03-family-wave", [0, 1150, 4000, 2500]],
];
for (const [id, slug, [left, top, width, height]] of P) {
  const base = sharp(`${dir}/p${id}.jpg`).extract({ left, top, width, height })
    .resize(2000, 1250, { withoutEnlargement: true, kernel: "lanczos3" })
    .linear([1.03, 1.0, 0.96], [0, 0, 0]).modulate({ saturation: 1.03 }); // mild warm daylight, no tint
  const o = `public/images/story/${slug}`;
  await base.clone().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(o + ".jpg");
  await base.clone().resize(1000).jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(o + "-sm.jpg");
  console.log(slug, (await sharp(o + ".jpg").metadata()).width + "x" + (await sharp(o + ".jpg").metadata()).height);
}

// Panel 04 Glow Night: ungraded (night colours kept). Source Pexels 8448579 (original 5184x3456).
{
  const o = "public/images/story/04-glow-night";
  const base = sharp(`${dir}/p8448579.jpg`).extract({ left: 0, top: 108, width: 5184, height: 3240 })
    .resize(2000, 1250, { withoutEnlargement: true, kernel: "lanczos3" });
  await base.clone().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(o + ".jpg");
  await base.clone().resize(1000).jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(o + "-sm.jpg");
  console.log("04-glow-night", (await sharp(o + ".jpg").metadata()).width + "x" + (await sharp(o + ".jpg").metadata()).height);
}

// Contact sheet of Pexels candidates: node scripts/stock-sheet.mjs out.jpg id1 id2 ...
import sharp from "sharp";
const [out, ...ids] = process.argv.slice(2);
const W = 480, H = 320, cols = 4;
const tiles = await Promise.all(ids.map(async (id, i) => {
  const r = await fetch(`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${W}`);
  const b = Buffer.from(await r.arrayBuffer());
  const t = await sharp(b).resize(W, H, { fit: "contain", background: "#222" })
    .composite([{ input: Buffer.from(`<svg width="${W}" height="40"><text x="6" y="30" font-size="30" fill="yellow">${id}</text></svg>`), top: 0, left: 0 }]).jpeg().toBuffer();
  return { input: t, left: (i % cols) * W, top: Math.floor(i / cols) * H };
}));
await sharp({ create: { width: cols * W, height: Math.ceil(ids.length / cols) * H, channels: 3, background: "#000" } }).composite(tiles).jpeg({ quality: 80 }).toFile(out);

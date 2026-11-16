// Contact sheet of crops for visual review: node scripts/sheet.mjs <out.png>
import sharp from "sharp";
const n = ["race-climber", "athlete-arch", "slider", "runners", "tunnel"];
const bufs = await Promise.all(n.map((x) => sharp("public/assets/art/" + x + ".jpg").resize({ height: 420 }).toBuffer()));
const ms = await Promise.all(bufs.map((b) => sharp(b).metadata()));
let x = 0;
const comp = bufs.map((b, i) => { const o = { input: b, left: x, top: 0 }; x += ms[i].width + 8; return o; });
await sharp({ create: { width: x, height: 420, channels: 3, background: "#fff" } }).composite(comp).png().toFile(process.argv[2]);

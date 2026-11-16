// Vectorise flat-colour poster crops: node scripts/trace.mjs <name> <l> <t> <r> <b> [scale] [colors]
import sharp from "sharp"; import fs from "node:fs"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url); const ImageTracer = require("imagetracerjs");
const [name,l,t,r,b,scale="4",colors="28"] = process.argv.slice(2); const s=+scale;
const src="public/assets/art/campaign-poster.jpg";
const w=+r-+l,h=+b-+t;
const { data, info } = await sharp(src).extract({left:+l,top:+t,width:w,height:h}).resize(w*s,h*s,{kernel:"lanczos3"}).median(9).blur(2.2).raw().ensureAlpha().toBuffer({resolveWithObject:true});
const svg = ImageTracer.imagedataToSVG({data:new Uint8ClampedArray(data),width:info.width,height:info.height},
 {numberofcolors:+colors,colorsampling:2,colorquantcycles:6,ltres:2,qtres:2,pathomit:60*s,blurradius:0,blurdelta:20,strokewidth:0,roundcoords:1,scale:1,viewbox:true,desc:false,linefilter:true});
fs.writeFileSync(`public/assets/art/vec/${name}.svg`,svg);
await sharp(Buffer.from(svg),{density:72}).resize(info.width).png().toFile(`public/assets/art/vec/${name}.render.png`);
console.log(name,info.width,info.height,(svg.length/1024|0)+"KB");

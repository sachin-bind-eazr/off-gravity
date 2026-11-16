import sharp from "sharp";
const [vec,out,l,t,w,h]=process.argv.slice(2);
const a=await sharp(vec).extract({left:+l,top:+t,width:+w,height:+h}).toBuffer();
const b=await sharp("public/assets/art/campaign-poster.jpg").extract({left:0,top:364,width:709,height:478}).resize(2836,1912,{kernel:"lanczos3"}).extract({left:+l,top:+t,width:+w,height:+h}).toBuffer();
await sharp({create:{width:+w*2+10,height:+h,channels:3,background:"#fff"}}).composite([{input:b,left:0,top:0},{input:a,left:+w+10,top:0}]).png().toFile(out);

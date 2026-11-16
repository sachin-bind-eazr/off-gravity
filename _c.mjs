import { chromium } from "@playwright/test";
const out=process.argv[2]; const b=await chromium.launch();
const cities=["Mumbai","Bengaluru","Delhi","Chandigarh","Jaipur","Satara"];
const hit=(a,c)=>!(a.right<=c.left||a.left>=c.right||a.bottom<=c.top||a.top>=c.bottom);
let bad=0;
for(const w of [360,390,768,1024,1440]){
  const p=await b.newPage({viewport:{width:w,height:900}});
  await p.goto("http://localhost:3118/",{waitUntil:"load",timeout:120000}); await p.waitForTimeout(1500);
  await p.evaluate(()=>document.querySelector(".og-map").scrollIntoView({block:"center"})); await p.waitForTimeout(3000);
  const check=async(tag)=>{
    const r=await p.evaluate(()=>{
      const map=document.querySelector(".og-map").getBoundingClientRect();
      const card=document.querySelector(".og-tour-in"); const cardR=card&&getComputedStyle(card).position==="absolute"?card.getBoundingClientRect():null;
      const mks=[...document.querySelectorAll(".og-mk")].map(m=>{const d=m.querySelector(".og-mk__dot").getBoundingClientRect();const l=m.querySelector(".og-mk__lab");const lr=l.getBoundingClientRect();const vis=getComputedStyle(l).visibility!=="hidden";return {on:m.dataset.on==="true",name:m.querySelector(".og-mk__city").textContent,dot:d.toJSON(),lab:lr.toJSON(),vis}});
      return {map:map.toJSON(),cardR:cardR&&cardR.toJSON(),mks};});
    const inMap=x=>x.left>=r.map.left-1&&x.right<=r.map.right+1&&x.top>=r.map.top-1&&x.bottom<=r.map.bottom+1;
    const probs=[];
    const vis=r.mks.filter(m=>inMap(m.dot));
    for(let i=0;i<vis.length;i++)for(let j=i+1;j<vis.length;j++){ if(hit(vis[i].dot,vis[j].dot))probs.push(`dot ${vis[i].name}/${vis[j].name}`);}
    const labs=r.mks.filter(m=>m.vis&&inMap(m.dot)&&m.lab.width>0);
    for(let i=0;i<labs.length;i++){ for(let j=i+1;j<labs.length;j++) if(hit(labs[i].lab,labs[j].lab))probs.push(`lab ${labs[i].name}/${labs[j].name}`);
      for(const m of vis) if(m.name!==labs[i].name&&hit(labs[i].lab,m.dot))probs.push(`lab ${labs[i].name} on dot ${m.name}`);
      if(r.cardR&&hit(labs[i].lab,r.cardR))probs.push(`lab ${labs[i].name} under card`);}
    const sel=r.mks.find(m=>m.on);
    if(!sel.vis||!inMap(sel.lab)||!inMap(sel.dot))probs.push(`selected ${sel.name} not fully inside/visible`);
    if(r.cardR&&hit(sel.dot,r.cardR))probs.push("selected marker under card");
    if(probs.length){bad+=probs.length;console.log(w,tag,"PROBLEMS",probs.join("; "));} else console.log(w,tag,"ok", `visible markers ${vis.length}, labels ${labs.length}`);
  };
  await check("initial");
  if(w===390) await p.screenshot({path:`${out}/m2/m390-initial.png`});
  for(const c of cities){
    await p.evaluate(()=>document.querySelector(".og-map").scrollIntoView({block:"center"}));
    await p.locator(`[role=radio]:has-text("${c}")`).first().click({force:true}); await p.waitForTimeout(1600);
    await check(c);
    if(w===390&&(c==="Jaipur"||c==="Mumbai")) await p.screenshot({path:`${out}/m2/m390-${c}.png`});
    if(w===1440&&c==="Jaipur") await p.screenshot({path:`${out}/m2/d1440-${c}.png`});
  }
  await p.close();
}
console.log("TOTAL PROBLEMS",bad); await b.close();

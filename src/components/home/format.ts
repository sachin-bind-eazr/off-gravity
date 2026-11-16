const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const P = (s: string) => { const [y, m, d] = s.split("-").map(Number); return { y, m: m - 1, d, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }; };
export function fmtRange(a: string, b: string, short = false) { const x = P(a), y = P(b); const mo = short ? M : FULL; return x.m === y.m ? `${x.d}–${y.d} ${mo[x.m]}` : `${x.d} ${mo[x.m]}–${y.d} ${mo[y.m]}`; }
export function fmtFull(a: string, b: string) { return `${fmtRange(a, b)} 2027`; }
export function fmtDay(s: string) { const x = P(s); return `${DOW[x.dow]} ${x.d} ${FULL[x.m]}`; }

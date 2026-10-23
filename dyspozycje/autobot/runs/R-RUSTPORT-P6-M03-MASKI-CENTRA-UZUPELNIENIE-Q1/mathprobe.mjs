// sonda: Math.* V8 na rozkladach argumentow uzywanych przez maski
let s = 12345;
const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
const out = { pow: [], atan2: [], sin: [], hypot: [] };
for (const e of [1.55, 1.88, 2.2, 2.0]) for (let i = 0; i < 3000; i++) { const x = rnd() * 3; out.pow.push([e, x, Math.pow(x, e)]); }
for (let i = 0; i < 6000; i++) { const y = rnd() * 2 - 1, x = rnd() * 2 - 1; out.atan2.push([y, x, Math.atan2(y, x)]); }
for (let i = 0; i < 6000; i++) { const a = rnd() * 2 * Math.PI - Math.PI; out.sin.push([a, Math.sin(a)]); }
for (let i = 0; i < 6000; i++) { const a = rnd() * 2 - 1, b = rnd() * 2 - 1; out.hypot.push([a, b, Math.hypot(a, b)]); }
console.log(JSON.stringify(out));

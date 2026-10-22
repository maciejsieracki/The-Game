// Math.sin / Math.cos reference vectors of node v22.22.0 (V8 12.4.254.21)
// for the `jstrig` port (R-RUSTPORT-P4-13-MOD04-UNIT-CORE-Q1).
// Usage: node gen_trig.mjs <out-dir>
// Output trig.json: { n, data } where data is one hex string, 48 hex digits
// per sample = bits(x) bits(sin x) bits(cos x) (big-endian u64 each).
import * as fs from 'node:fs';
import * as path from 'node:path';

let seed = 0x2545f491;
const rnd = () => {
  // xorshift32, deterministic
  seed ^= seed << 13; seed >>>= 0;
  seed ^= seed >>> 17;
  seed ^= seed << 5; seed >>>= 0;
  return seed / 4294967296;
};

const xs = [];
// special and boundary values
for (const v of [0, -0, 1e-300, -1e-300, 1e-9, 0.25, 0.5, Math.PI / 4, Math.PI / 2, Math.PI, 2 * Math.PI,
  3 * Math.PI / 4, -Math.PI / 2, 0.7853981633974483, 0.785398163397448, 2.356194490192345, 1.5707963267948966,
  -1.5707963267948966, 0.275, 0.5103981633974483, 1e5, -1e5, 823549.6, -823549.6]) xs.push(v);
// every angle literal family used by the unit builders: k * 0.01 in [-8, 8]
for (let k = -800; k <= 800; k++) xs.push(k * 0.01);
// halves (Euler -> quaternion takes x / 2)
for (let k = -800; k <= 800; k++) xs.push((k * 0.01) / 2);
// random: uniform in [-10, 10] and log-uniform up to 1e5
for (let i = 0; i < 6000; i++) xs.push((rnd() * 2 - 1) * 10);
for (let i = 0; i < 2000; i++) xs.push((rnd() < 0.5 ? -1 : 1) * Math.exp(rnd() * Math.log(1e5)));

const dv = new DataView(new ArrayBuffer(8));
const hx = (v) => { dv.setFloat64(0, v, false); return dv.getBigUint64(0, false).toString(16).padStart(16, '0'); };
let data = '';
for (const x of xs) data += hx(x) + hx(Math.sin(x)) + hx(Math.cos(x));
const dir = process.argv[2] ?? '.';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'trig.json'), JSON.stringify({ node: process.version, v8: process.versions.v8, n: xs.length, data }));
console.log(`trig samples=${xs.length}`);

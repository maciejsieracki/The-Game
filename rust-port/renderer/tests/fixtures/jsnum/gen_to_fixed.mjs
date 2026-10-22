// V8 reference vectors for `Number.prototype.toFixed(digits)`
// (R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1, `core::jsnum::js_to_fixed`).
//
// Plain node, no dependencies. Writes one case per line:
//   <16 hex digits: binary64 bits of x, big-endian> <digits> <x.toFixed(digits)>
// (`toFixed` never produces a space). The first line is a header comment.
//
// Usage: node gen_to_fixed.mjs > to_fixed.txt
// Deterministic (fixed xorshift seeds): two runs give identical output.

const buf = new DataView(new ArrayBuffer(8));
const bits = (x) => { buf.setFloat64(0, x, false); return buf.getBigUint64(0, false).toString(16).padStart(16, '0'); };
const fromBits = (b) => { buf.setBigUint64(0, b, false); return buf.getFloat64(0, false); };

let s = 0x9e3779b97f4a7c15n;
const M = (1n << 64n) - 1n;
const next = () => { s ^= (s << 13n) & M; s ^= s >> 7n; s ^= (s << 17n) & M; return s; };
const rnd = () => Number(next() >> 11n) / 2 ** 53; // [0, 1)
const rint = (n) => Math.floor(rnd() * n);

const cases = [];
const seen = new Set();
const add = (x, d) => {
  const k = `${bits(x)} ${d}`;
  if (seen.has(k)) return;
  seen.add(k);
  cases.push(`${k} ${x.toFixed(d)}`);
};

// 1. Specials x every digits value 0..100.
const specials = [
  NaN, Infinity, -Infinity, 0, -0, 0.5, -0.5, 1.5, 2.5, -2.5, 1.005, 1.045, 0.125, 0.375, -0.625,
  1e21, -1e21, 999999999999999900000, 1e21 - 65536, -(1e21 - 65536), 1e20, 123456789012345680000,
  2 ** 53, 2 ** 53 + 2, -(2 ** 53) - 2, 2 ** 52 + 0.5, 4503599627370495.5, 1e15, 1e15 + 0.5, 1e16,
  Number.MAX_VALUE, -Number.MAX_VALUE, Number.MIN_VALUE, -Number.MIN_VALUE, 2.2250738585072014e-308,
  1e-7, -1e-7, 5e-7, 4.44e-16, -4.44e-16, 0.1, 0.2, 0.3, 1 / 3, -2 / 3, Math.PI, -Math.E, 0.0005,
  0.015625, -0.015625, 0.03125, 0.0625, -0.0625, 0.1875, 2.5625, 1e-100, 1.5e-50, 9.5, 99.5, 999.5,
];
for (const x of specials) for (let d = 0; d <= 100; d++) add(x, d);

// 2. Decimal-looking values of every magnitude, digits 0..20 (the range the
//    renderer uses: 3, 4, 5), both signs.
for (let d = 0; d <= 20; d++) {
  for (let n = 0; n < 500; n++) {
    const e = rint(36) - 14; // 1e-14 .. 1e21
    let x = (rnd() * 10) * 10 ** e;
    if (rnd() < 0.3) x = Math.round(x * 10 ** (d + 1)) / 10 ** (d + 1); // d+1 decimals (near ties)
    add(rnd() < 0.5 ? -x : x, d);
  }
}

// 3. Exact binary ties at d decimals: |x| * 2^(d+1) odd, i.e. x = odd / 2^(d+1)
//    (+ an integer part), digits 0..20, both signs.
for (let d = 0; d <= 20; d++) {
  for (let n = 0; n < 250; n++) {
    const odd = 2 * rint(2 ** Math.min(20, d + 1)) + 1;
    const intPart = rnd() < 0.5 ? 0 : rint(10 ** rint(12));
    const x = intPart + odd / 2 ** (d + 1);
    add(rnd() < 0.5 ? -x : x, d);
  }
}

// 4. Random finite bit patterns (any magnitude, subnormals included), digits 0..100.
for (let n = 0; n < 4000; n++) {
  const x = fromBits(next());
  if (!Number.isFinite(x)) continue;
  add(x, rint(101));
}

// 5. Random values in [-8, 8] with few bits (grid 1/2^k), digits 0..12: dense ties.
for (let n = 0; n < 4000; n++) {
  const k = rint(16);
  const x = (rint(16 * 2 ** k) - 8 * 2 ** k) / 2 ** k;
  add(x, rint(13));
}

process.stdout.write(`# node ${process.version} v8 ${process.versions.v8} cases ${cases.length}\n`);
process.stdout.write(cases.join('\n') + '\n');

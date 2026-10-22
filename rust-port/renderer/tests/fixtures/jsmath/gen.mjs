// V8 reference vectors for `src/jsmath` (R-RUSTPORT-P4-16-JSMATH-Q1).
//
// Run with node v22.22.0 (V8 12.4.254.21) OUTSIDE the repository:
//   node gen.mjs <out-dir>
// Writes `<name>.bin` (little-endian f64 rows: arguments..., result) and
// `manifest.json` (counts + SHA-256 of every .bin) into <out-dir>.
// No npm packages are needed: only `Math.*` of the running V8 is measured.
//
// Arguments are produced from a fixed-seed PRNG (xorshift128+ on BigInt), so
// the same script always yields the same arguments; the RESULTS are whatever
// the running V8 returns. Every call goes through a `Math.*` call site that
// is executed > 20 000 times, so both the interpreter (Ignition) and the
// optimising tiers (Maglev/TurboFan) produce part of the values; the
// regeneration check also runs with `--jitless` and must give the same bytes.

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2];
if (!out) throw new Error('usage: node gen.mjs <out-dir>');
mkdirSync(out, { recursive: true });

// ---------------------------------------------------------------- PRNG
let s0 = 0x9e3779b97f4a7c15n;
let s1 = 0xbf58476d1ce4e5b9n;
const M64 = (1n << 64n) - 1n;
function next64() {
  let x = s0;
  const y = s1;
  s0 = y;
  x = (x ^ (x << 23n)) & M64;
  s1 = x ^ y ^ (x >> 17n) ^ (y >> 26n);
  return (s1 + y) & M64;
}
const buf = new DataView(new ArrayBuffer(8));
function fromBits(b) {
  buf.setBigUint64(0, b, true);
  return buf.getFloat64(0, true);
}
function toBits(x) {
  buf.setFloat64(0, x, true);
  return buf.getBigUint64(0, true);
}
// uniform in [0, 1) with 53 random bits
function rnd() {
  return Number(next64() >> 11n) / 9007199254740992;
}
function uni(a, b) {
  return a + (b - a) * rnd();
}
function sign() {
  return next64() & 1n ? -1 : 1;
}
// ±10^U(lo, hi)
function logUni(lo, hi) {
  return sign() * Math.pow(10, uni(lo, hi));
}
// nudge x by k ulps (k may be negative)
function ulps(x, k) {
  if (!Number.isFinite(x) || x === 0) return x;
  let b = toBits(x);
  const neg = x < 0;
  const step = BigInt(Math.abs(k));
  b = (k > 0) !== neg ? b + step : b - step;
  return fromBits(b & M64);
}
// random finite bit pattern
function randomFinite() {
  for (;;) {
    const x = fromBits(next64());
    if (Number.isFinite(x)) return x;
  }
}
const SUB_MIN = fromBits(1n);
const SUB_MAX = fromBits(0x000fffffffffffffn);
const NORM_MIN = fromBits(0x0010000000000000n);
const SPECIAL = [
  0, -0, NaN, Infinity, -Infinity, SUB_MIN, -SUB_MIN, SUB_MAX, -SUB_MAX, NORM_MIN, -NORM_MIN,
  Number.MAX_VALUE, -Number.MAX_VALUE, 1, -1, 0.5, -0.5, 2, -2, Number.EPSILON, -Number.EPSILON,
];

// Medium-range arguments (|x| <= 2^19*pi/2) next to k*pi/2 (k <= 667 000,
// +-3 ulp) whose reduction needs the THIRD iteration of __ieee754_rem_pio2
// (cancellation > 49 bits): found by an exhaustive scratch search (Rust port
// with vs without that iteration, 222 of 9.3 M candidates differ; P4-16 doc
// section 8). Positive halves; the negatives are added below.
const HARD_REDUCTION = [
  0x40e67e57cdd4dc54n, 0x40efe9e875a67a0bn, 0x40f2527efa4987a4n, 0x40f65a1dd290660fn,
  0x40f6d9be62d85044n, 0x40ffe9e875a67a0bn, 0x4100dec1da5fa53fn, 0x410193e3c2b5f498n,
  0x41041fde4b8af12en, 0x41049decbc1d9720n, 0x41052fe91efc0f23n, 0x4105e4f1e5570a37n,
  0x41065a1dd290660fn, 0x4106d9be62d85044n, 0x410ac0541042eb10n, 0x410b16eb242b3df5n,
  0x410b68cbd8f3c410n, 0x410bf9b3c6059d24n, 0x410d883191f6b21bn, 0x410df4df83c414ean,
  0x410fe9e875a67a0bn, 0x41103312f8c7c488n, 0x4110dec1da5fa53fn, 0x411106fbfe65c55dn,
  0x411106fbfe65c560n, 0x411193e3c2b5f498n, 0x4112176b59c43463n, 0x4112cc0f9831de68n,
  0x41139c6fd67805a7n, 0x4113ae996517eaecn, 0x41141fde4b8af12en, 0x41149decbc1d9720n,
  0x4115e4f1e5570a37n, 0x41165a1dd290660fn, 0x4116d9be62d85044n, 0x411738c098b01cfdn,
  0x41181b4a65962980n, 0x41181b4a65962983n, 0x4118cf57d81fd9edn, 0x4118e092a3ec1eaan,
  0x41193c05c9ed3cbcn, 0x4119ccedb6ff15d0n, 0x411aacf6a15c3d8an, 0x411ad753687cc674n,
  0x411b16eb242b3df5n, 0x411b5b6b82f02ac7n, 0x411b90ecdafe8febn, 0x411bf9b3c6059d24n,
  0x411d883191f6b21bn, 0x411df4df83c414ean, 0x411f03b676ee6a9bn, 0x411fafd028f27174n,
  0x411fe9e875a67a0bn, 0x41203312f8c7c488n, 0x4120dec1da5fa53fn, 0x412106fbfe65c55dn,
  0x412106fbfe65c560n, 0x412193e3c2b5f498n, 0x41223d98d86bd573n, 0x4122cc0f9831de68n,
  0x41232dce6147780dn, 0x41239c6fd67805a7n, 0x4123ae996517eaecn, 0x41241fde4b8af12en,
  0x412421eaf0e9703dn, 0x41249decbc1d9720n, 0x4124fb46d48435dbn, 0x4125e4f1e5570a37n,
  0x41261d9458908d58n, 0x41265a1dd290660fn, 0x4126a86c5342d2fan, 0x4126d9be62d85044n,
  0x412738c098b01cfdn, 0x4127c65526a02f8cn, 0x41280168c72582cdn, 0x41281b4a65962980n,
  0x41281b4a65962983n, 0x412836e3d6b512e2n, 0x4128b690f7faa737n, 0x4128cf57d81fd9edn,
  0x4128e092a3ec1eaan, 0x41293c05c9ed3cbcn, 0x4129ccedb6ff15d0n, 0x412a5268d1708066n,
  0x412a6d03ca7eb492n, 0x412a9adcc7f96cf0n, 0x412aacf6a15c3d8an, 0x412abd6b818d4aaen,
  0x412b16eb242b3df5n, 0x412b200fa0b84542n, 0x412b4f8d9764c113n, 0x412b4f8d9764c114n,
  0x412b4f8d9764c119n, 0x412b5b6b82f02ac7n, 0x412b61d6907ecfb0n, 0x412b6ba7d6abba52n,
  0x412b9fa9e8815a66n, 0x412bf9b3c6059d24n, 0x412c480246b80a0fn, 0x412d883191f6b21bn,
  0x412df4df83c414ean, 0x412df72afe16e6a4n, 0x412e49fa75b30d47n, 0x412e686fe489ece6n,
  0x412e6fc0482df2bdn, 0x412e83d3ed72c333n, 0x412ed9b4cafcf327n, 0x412ed9b4cafcf32an,
  0x412f03b676ee6a9bn, 0x412fe9e875a67a0bn, 0x412ff1fec4e5b77bn,
].map(fromBits);

const N = 20000;

// ---------------------------------------------------------------- argument sets
function trigArgs() {
  const a = [...SPECIAL];
  // fdlibm branch borders and hard reduction cases
  for (const b of [
    Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, 2 * Math.PI, 0.6744, 0.3,
    0.78125, 2 ** -27, 2 ** -28, 2 ** 19 * (Math.PI / 2), 2 ** 20, 1e22, 5.319372648326541e255,
    1e6, 823550, 823551, 2 ** 1023,
  ]) {
    for (let k = -3; k <= 3; k++) {
      a.push(ulps(b, k), -ulps(b, k));
    }
  }
  for (const h of HARD_REDUCTION) a.push(h, -h);
  const quota = (frac) => Math.round(N * frac);
  for (let i = 0; i < quota(0.2); i++) a.push(uni(-1, 1)); // small
  for (let i = 0; i < quota(0.08); i++) a.push(logUni(-320, -1)); // tiny incl. subnormal
  for (let i = 0; i < quota(0.22); i++) {
    // ±k·π/4 and neighbours, k up to ±4000 (also the medium-reduction 2nd/3rd iteration)
    const k = Math.floor(uni(-4000, 4001));
    a.push(ulps((k * Math.PI) / 4, Math.floor(uni(-4, 5))));
  }
  for (let i = 0; i < quota(0.18); i++) a.push(uni(-1000, 1000)); // medium
  for (let i = 0; i < quota(0.17); i++) a.push(logUni(3, 6)); // large up to 1e6
  for (let i = 0; i < quota(0.08); i++) a.push(logUni(6, 308)); // huge (__kernel_rem_pio2)
  while (a.length < N + SPECIAL.length) a.push(randomFinite());
  return a;
}

function atanArgs() {
  const a = [...SPECIAL];
  for (const b of [0.4375, 0.6875, 1.1875, 2.4375, 2 ** 66, 2 ** -27, 1, 1.5]) {
    for (let k = -3; k <= 3; k++) a.push(ulps(b, k), -ulps(b, k));
  }
  for (let i = 0; i < 6000; i++) a.push(uni(-3, 3));
  for (let i = 0; i < 4000; i++) a.push(logUni(-320, 0));
  for (let i = 0; i < 6000; i++) a.push(logUni(0, 25));
  while (a.length < N + SPECIAL.length) a.push(randomFinite());
  return a;
}

function acosArgs() {
  const a = [...SPECIAL];
  for (const b of [0.5, 1, 2 ** -57, 1e-17]) {
    for (let k = -3; k <= 3; k++) a.push(ulps(b, k), -ulps(b, k));
  }
  for (let i = 0; i < 12000; i++) a.push(uni(-1, 1));
  for (let i = 0; i < 3000; i++) a.push(sign() * (1 - Math.pow(10, uni(-16, -1)))); // near ±1
  for (let i = 0; i < 3000; i++) a.push(logUni(-320, 0));
  while (a.length < N + SPECIAL.length) a.push(uni(-1.5, 1.5));
  return a;
}

function expArgs() {
  const a = [...SPECIAL];
  for (const b of [
    709.782712893384, 709.7827128933840, -745.1332191019411, 0.34657359027997264,
    1.0397207708399179, 2 ** -28, 1, 1024 * Math.LN2, -1021 * Math.LN2, -1074 * Math.LN2,
  ]) {
    for (let k = -3; k <= 3; k++) a.push(ulps(b, k), -ulps(b, k));
  }
  for (let i = 0; i < 6000; i++) a.push(uni(-2, 2));
  for (let i = 0; i < 8000; i++) a.push(uni(-750, 712));
  for (let i = 0; i < 2000; i++) a.push(logUni(-320, -1));
  for (let i = 0; i < 2000; i++) {
    const k = Math.floor(uni(-1080, 1030));
    a.push(ulps(k * Math.LN2, Math.floor(uni(-4, 5))));
  }
  while (a.length < N + SPECIAL.length) a.push(uni(-800, 800));
  return a;
}

function logArgs() {
  const a = [...SPECIAL];
  for (const b of [1, 2, 0.5, Math.E, 10, 1 + 2 ** -20, 1 - 2 ** -20]) {
    for (let k = -4; k <= 4; k++) a.push(ulps(b, k));
  }
  for (let i = 0; i < 8000; i++) a.push(Math.abs(logUni(-308, 308)));
  for (let i = 0; i < 4000; i++) a.push(1 + sign() * Math.pow(10, uni(-16, -0.3))); // near 1
  for (let i = 0; i < 2000; i++) a.push(fromBits(next64() & 0x000fffffffffffffn)); // subnormal
  for (let i = 0; i < 2000; i++) a.push(uni(0, 100));
  for (let i = 0; i < 500; i++) a.push(-Math.abs(logUni(-10, 10))); // negative → NaN
  while (a.length < N + SPECIAL.length) a.push(Math.abs(randomFinite()));
  return a;
}

function pick(arr) {
  return arr[Math.floor(rnd() * arr.length)];
}

function atan2Args() {
  const r = [];
  for (const y of SPECIAL) for (const x of SPECIAL) r.push([y, x]);
  const gens = [() => uni(-10, 10), () => logUni(-320, 308), () => randomFinite(), () => pick(SPECIAL)];
  for (let i = 0; i < 8000; i++) r.push([uni(-1, 1), uni(-1, 1)]);
  for (let i = 0; i < 4000; i++) r.push([pick(gens)(), pick(gens)()]);
  for (let i = 0; i < 3000; i++) {
    // |y/x| around 2^±60 and x = 1
    const x = logUni(-100, 100);
    r.push([x * Math.pow(2, uni(-70, 70)) * sign(), x]);
  }
  for (let i = 0; i < 1000; i++) r.push([uni(-5, 5), 1]);
  while (r.length < N + SPECIAL.length ** 2) r.push([uni(-1000, 1000), uni(-1000, 1000)]);
  return r;
}

function powArgs() {
  const r = [];
  const sp = [...SPECIAL, 3, -3, 0.25, 10, 2.4, 0.41666, 1 / 3, 1e10, -1e10, 2 ** 53, 2 ** 63];
  for (const x of sp) for (const y of sp) r.push([x, y]);
  for (let i = 0; i < 5000; i++) r.push([uni(0, 1), pick([2.4, 0.41666, 0.5, 0.25, 2, 3])]);
  for (let i = 0; i < 5000; i++) r.push([uni(0, 10), uni(-10, 10)]);
  for (let i = 0; i < 2000; i++) r.push([1 + sign() * Math.pow(10, uni(-16, -1)), logUni(0, 18)]); // near 1
  for (let i = 0; i < 2000; i++) r.push([uni(-10, 0), Math.floor(uni(-60, 60))]); // negative base, int exp
  for (let i = 0; i < 2000; i++) r.push([Math.abs(logUni(-300, 300)), uni(-3, 3)]); // over/underflow
  for (let i = 0; i < 1000; i++) r.push([uni(-10, 10), uni(-10, 10)]); // negative base, fractional exp
  for (let i = 0; i < 1000; i++) r.push([2, uni(-1080, -1020)]); // subnormal results
  while (r.length < N + sp.length ** 2) r.push([randomFinite(), uni(-4, 4)]);
  return r;
}

function hypotArgs() {
  const r = [];
  for (const a of SPECIAL) for (const b of SPECIAL) r.push([a, b]);
  for (let i = 0; i < 8000; i++) r.push([uni(-10, 10), uni(-10, 10)]);
  for (let i = 0; i < 6000; i++) r.push([logUni(-320, 308), logUni(-320, 308)]);
  for (let i = 0; i < 3000; i++) {
    const a = logUni(-200, 200);
    r.push([a, a * Math.pow(10, uni(-20, 0))]);
  }
  while (r.length < N + SPECIAL.length ** 2) r.push([randomFinite(), randomFinite()]);
  return r;
}

// fdlibm `e_asin.c` branches: |x| < 2^-27, |x| < 0.5, 0.5 <= |x| < 0.975
// (split sqrt), |x| > 0.975 (`0x3fef3333`), |x| = 1, |x| > 1 (NaN).
function asinArgs() {
  const a = [...SPECIAL];
  for (const b of [0.5, 0.975, fromBits(0x3fef333300000000n), 1, 2 ** -27, 2 ** -28, 1e-17]) {
    for (let k = -3; k <= 3; k++) a.push(ulps(b, k), -ulps(b, k));
  }
  for (let i = 0; i < 8000; i++) a.push(uni(-1, 1));
  for (let i = 0; i < 3000; i++) a.push(sign() * uni(0.5, 1)); // split-sqrt / > 0.975 branches
  for (let i = 0; i < 3000; i++) a.push(sign() * (1 - Math.pow(10, uni(-16, -1)))); // near ±1
  for (let i = 0; i < 3000; i++) a.push(logUni(-320, 0)); // tiny incl. subnormal
  for (let i = 0; i < 1000; i++) a.push(Math.sin(uni(-10, 10))); // sin of an angle (Euler round trips)
  while (a.length < N + SPECIAL.length) a.push(uni(-1.5, 1.5)); // incl. |x| > 1 → NaN
  return a;
}

function hypot3Args() {
  const r = [];
  for (let i = 0; i < 2000; i++) r.push([uni(-10, 10), uni(-10, 10), uni(-10, 10)]);
  for (let i = 0; i < 1000; i++) r.push([logUni(-300, 300), logUni(-300, 300), logUni(-300, 300)]);
  r.push([NaN, Infinity, 1], [NaN, 1, 2], [0, -0, 0], [3, 4, 12]);
  return r;
}

// ---------------------------------------------------------------- evaluate
const FUNCS = [
  ['sin', 1, trigArgs, (x) => Math.sin(x)],
  ['cos', 1, trigArgs, (x) => Math.cos(x)],
  ['tan', 1, trigArgs, (x) => Math.tan(x)],
  ['atan', 1, atanArgs, (x) => Math.atan(x)],
  ['acos', 1, acosArgs, (x) => Math.acos(x)],
  ['exp', 1, expArgs, (x) => Math.exp(x)],
  ['log', 1, logArgs, (x) => Math.log(x)],
  ['atan2', 2, atan2Args, (a) => Math.atan2(a[0], a[1])],
  ['pow', 2, powArgs, (a) => Math.pow(a[0], a[1])],
  ['hypot', 2, hypotArgs, (a) => Math.hypot(a[0], a[1])],
  ['hypot3', 3, hypot3Args, (a) => Math.hypot(a[0], a[1], a[2])],
  // Added by R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1 (js_asin moved into
  // jsmath). LAST in the list on purpose: the PRNG stream of every function
  // above is unchanged, so their .bin files stay byte-identical.
  ['asin', 1, asinArgs, (x) => Math.asin(x)],
];

const manifest = {
  topic: 'R-RUSTPORT-P4-16-JSMATH-Q1',
  node: process.version,
  v8: process.versions.v8,
  execArgv: process.execArgv,
  format: 'little-endian f64 rows: arity arguments then the result',
  functions: [],
};
for (const [name, arity, argsFn, f] of FUNCS) {
  const args = argsFn();
  const rows = new Float64Array(args.length * (arity + 1));
  let nan = 0;
  args.forEach((a, i) => {
    const v = f(a);
    const base = i * (arity + 1);
    if (arity === 1) rows[base] = a;
    else for (let k = 0; k < arity; k++) rows[base + k] = a[k];
    rows[base + arity] = v;
    if (Number.isNaN(v)) nan++;
  });
  const bytes = Buffer.from(rows.buffer);
  const file = `${name}.bin`;
  writeFileSync(join(out, file), bytes);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  manifest.functions.push({ name, arity, count: args.length, nanResults: nan, file, sha256 });
  console.log(`${name}: count=${args.length} nan=${nan} sha256=${sha256}`);
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

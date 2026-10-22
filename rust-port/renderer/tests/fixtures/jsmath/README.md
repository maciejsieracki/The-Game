# `Math.*` reference vectors of V8 (R-RUSTPORT-P4-16-JSMATH-Q1)

Reference data for `tests/jsmath_v8_parity.rs` and `tests/jsmath_wiring.rs`,
produced by **running** node v22.22.0 (`process.versions.v8` =
`12.4.254.21-node.33`) — no npm package, only the engine's own `Math.*`.

| File | Function | Arity | Rows |
|---|---|---|---|
| `sin.bin` | `Math.sin` | 1 | 20 021 |
| `cos.bin` | `Math.cos` | 1 | 20 021 |
| `tan.bin` | `Math.tan` | 1 | 20 021 |
| `atan.bin` | `Math.atan` | 1 | 20 021 |
| `acos.bin` | `Math.acos` | 1 | 20 021 |
| `exp.bin` | `Math.exp` | 1 | 20 021 |
| `log.bin` | `Math.log` | 1 | 20 021 |
| `atan2.bin` | `Math.atan2(y, x)` | 2 | 20 441 |
| `pow.bin` | `Math.pow(x, y)` | 2 | 21 024 |
| `hypot.bin` | `Math.hypot(a, b)` | 2 | 20 441 |
| `hypot3.bin` | `Math.hypot(a, b, c)` | 3 | 3 004 |

Format: little-endian `f64` rows — the arguments, then the result. Counts and
SHA-256 of every file: `manifest.json`. Argument classes (see `gen.mjs`):
special values (`0`, `-0`, NaN, `±∞`, smallest/largest subnormal, smallest
normal, `±MAX_VALUE`, `±1`, `±EPSILON`, …), fdlibm branch borders ± 3 ulp,
small (`[-1, 1]`), tiny (`10^[-320, -1]`, incl. subnormal), `k·π/4 ± 4 ulp`
for `|k| ≤ 4000`, medium (`[-1000, 1000]`), large (`10^[3, 6]`), huge
(`10^[6, 308]`, the `__kernel_rem_pio2` path), 222 medium-range arguments
next to `k·π/2` whose reduction needs the third iteration of
`__ieee754_rem_pio2` (`HARD_REDUCTION`, found by an exhaustive scratch search,
see `dyspozycje/rust-port/p4/P4-16-JSMATH.md` §5) and random finite bit
patterns; function-specific sets for `exp` (overflow/underflow thresholds,
`k·ln2`), `log` (near 1, subnormal, negative), `acos` (near ±1, out of
range), `atan2` (all special pairs, `|y/x|` around `2^±60`, `x = 1`), `pow`
(sRGB exponents 2.4 / 0.41666, near-1 bases, negative bases with integer
exponents, over/underflow, subnormal results) and `hypot`.

A result matches when `to_bits` is equal; when V8 returns NaN, any NaN is
accepted (a NaN payload is not observable through a JavaScript `Number`).

## Regeneration (outside the repository only)

```bash
S=<scratch dir outside the repo>
mkdir -p $S && cp rust-port/renderer/tests/fixtures/jsmath/gen.mjs $S/
node --version                     # v22.22.0
node $S/gen.mjs $S/out             # default tiers (Ignition → Maglev/TurboFan)
node --jitless $S/gen.mjs $S/jit   # interpreter only
node --always-turbofan $S/gen.mjs $S/tf
sha256sum $S/out/*.bin $S/jit/*.bin $S/tf/*.bin   # all three sets identical
cmp $S/out/sin.bin rust-port/renderer/tests/fixtures/jsmath/sin.bin  # … for every file
```

Measured on 2026-10-22: the three runs give byte-identical files (33 hashes,
11 distinct), equal to the committed ones (`manifest.json`). The arguments
come from a fixed-seed xorshift128+, so a re-run reproduces the files bit for
bit.

# `Number.prototype.toFixed` reference data (R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1)

Reference strings for `tests/jsnum_to_fixed_v8.rs` (`core::jsnum::js_to_fixed`,
the single `toFixed` implementation of the crate), produced by **running V8**:
node v22.22.0 (V8 `12.4.254.21-node.33`), plain node, no dependencies.

```bash
node rust-port/renderer/tests/fixtures/jsnum/gen_to_fixed.mjs > to_fixed.txt
```

Two runs give identical output (fixed xorshift seeds).

| File | SHA-256 | Content |
|---|---|---|
| `to_fixed.txt` | `fd883070813b237c223ee5cb6e1aaafa9242e004e447665cf485a18d61748d45` | header `# node v22.22.0 v8 12.4.254.21-node.33 cases 27808`, then one case per line: `<binary64 bits, 16 hex digits> <digits> <x.toFixed(digits)>`. 27 808 cases (duplicates by bits + digits dropped): 60 special values (NaN, ±∞, ±0, 1e21 and its neighbours, `MAX_VALUE`, `MIN_VALUE`, subnormals, classic ties such as 1.005, 2.5, 0.015625) × digits 0..100; decimal-looking values 1e−14..1e21 (both signs) × digits 0..20; exact binary ties at `digits` decimals (both signs); random finite bit patterns × digits 0..100; dense 1/2^k grid on [−8, 8] × digits 0..12. The test counts 12 503 negatives, 2 536 with \|x\| ≥ 1e21, 303 NaN/±∞, 4 810 exact ties, 7 804 with digits > 20. |
| `gen_to_fixed.mjs` | `c992a9da3932500308155961e61c3a6f9c451c50c3aaf59c4531765955c7a2c6` | the generator |

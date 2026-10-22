# Unit-core reference data (MOD-04, R-RUSTPORT-P4-13-MOD04-UNIT-CORE-Q1)

Reference vectors for `tests/unit_core_web_parity.rs`,
`tests/unit_core_model_rule.rs` and `tests/unit_core_trig.rs`. Every
expected value was produced by **running the web code** of `edb8fb56`:

- `three@0.169.0` from npm (integrity `sha512-Ed906MA3…qUv0w==`, the version
  of `gra/package-lock.json` at `edb8fb56`), `esbuild@0.24.0`, node v22.22.0
  (V8 12.4.254.21);
- `gra/src/**` and `gra/data/**` from `git archive edb8fb56 gra/src gra/data`,
  **imported unchanged** (`render/units.ts`, `render/kon-nowy-model.ts`,
  `render/galera-model.ts`, `render/jednostki-p1-rdzen.ts` and everything they
  import, `units/setup.ts` for `categoryOf`, `data/units.json`).

No WebGL renderer: the builders return `THREE.Group` trees of geometries and
materials; the generator calls `updateMatrixWorld(true)` and reads them.

## The only adaptation

`build.mjs` (esbuild plugin) **appends one `export { … }` line** to three web
files at bundle time (the files on disk stay untouched), so internal
functions can be called directly:

| File | Appended exports |
|---|---|
| `render/units.ts` | `buildCategoryModel`, `buildNamedUnit`, `buildSuperUnit`, `cultureFromName`, `normName`, `decorateChariot`, `applyCultureOverrides`, `attachEmbarkBoat`, `buildBaseAvatar`, `SUPER_Z_MODELEM_NAZWANYM`, `buildHierosLochos`, `buildCrossbowman`, `buildCeltWarrior`, `buildGermanWarrior`, `buildBerserker` + every `function getGeo*` (88) |
| `render/kon-nowy-model.ts` | every `function getGeoNH*` (20) |
| `render/jednostki-p1-rdzen.ts` | `p1Geos` (the singleton registry) |

Owner colours of the cases: `OWNER_A = 0xd03030`, `OWNER_B = 0x2a6fdb`.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive edb8fb56 gra/src gra/data | tar -x -C $S/websrc
cp rust-port/renderer/tests/fixtures/unit_core/{gen.ts,build.mjs,gen_trig.mjs} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
cd $S/refscript
node build.mjs            # -> gen.mjs
node gen.mjs ../out       # prints: unit_core cases=68 records=77 names=33
node gen_trig.mjs ../out  # prints: trig samples=11226
```

The output is deterministic (two runs → identical SHA-256).

## Files

| File | Content |
|---|---|
| `unit_core.json` | `cases` (68): full object tree of every case — per node `kind`, `name`, `parent`, `p`/`q`/`s` (position, quaternion, scale), `w` (`matrixWorld`), for meshes `geo` (`vtx`, `tri`, FNV-1a `hash` of position/normal/uv/index/groups) and `mat` (`color` hex, linear `lin`, `metalness`, `roughness`, `transparent`, `opacity`, `flatShading`) + index in `userData['mats']`; per case `mats`, `bbox`, `meshes`, `tris`, `sig`, `celticRetint`. `parts`: the 88 + 20 + 65 shared geometries. `records` (77): `categoryOf` + `buildUnitModel` signatures on the PL and EN name of every `units.json` row + 2 civilians, `normName`/`cultureFromName` of both names. `names`, `namedSigs`, `superSigs`: probes of `normName`, `cultureFromName`, `buildNamedUnit` and the `super` branch. |
| `trig.json` | 11 226 samples `x`, `Math.sin(x)`, `Math.cos(x)` (node v22.22.0) |
| `gen.ts`, `build.mjs`, `gen_trig.mjs` | the generators above |

**Floats are stored as their IEEE-754 binary64 bits** (`hx()` in `gen.ts`: 16
lowercase hex digits per number, big-endian, concatenated), so the Rust tests
compare with `to_bits()` and `-0`/`NaN` survive JSON. Signatures/hashes are
FNV-1a 32-bit over little-endian bytes (`Fnv` in `gen.ts` = `model::Fnv`).

SHA-256 at creation: see `dyspozycje/rust-port/p4/P4-13-MOD04-UNIT-CORE.md` §8.

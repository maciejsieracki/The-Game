# MOD-06 Bronze unit models — reference data (R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1)

Reference vectors for `tests/units_braz_web_parity.rs`. Every expected value
was produced by **running the web code** of `edb8fb56`:

- `three@0.169.0` and `esbuild@0.24.0` from npm (scratch install), node
  v22.22.0 (V8 12.4);
- `gra/src/**` and `gra/data/**` from `git archive edb8fb56 gra/src gra/data`,
  **imported unchanged and without any adaptation**: the 30 exported builders
  of `render/braz-*-opus5.ts` (9 files) and `render/jednostki-p2-inka.ts`,
  `-p3-dystans.ts`, `-p4-melee.ts`, `-p57-wlocznie-machiny.ts`,
  `-p8a-bliskiwschod.ts`, `-p8b-rozni.ts`; `buildUnitModel` of
  `render/units.ts`, `categoryOf` of `units/setup.ts`. The eight MOD-06
  builders that live inside `units.ts` (`buildMedjay`, `buildSumerianChariot`,
  `buildEgyptianChariot`, `buildChineseCavalry`, `buildSumerianRoyalGuard`,
  `buildHuBenWei`, `buildUThulwana`, `buildInkaRoyalGuard`) are not exported,
  so they are reached through the real entry point
  `buildUnitModel(categoryOf(...), owner, name)`.

No WebGL renderer: the builders return `THREE.Group` trees; the generator calls
`updateMatrixWorld(true)` and reads them. Owner colours: `OWNER_A = 0xd03030`,
`OWNER_B = 0x2a6fdb`.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive edb8fb56 gra/src gra/data | tar -x -C $S/websrc
cp rust-port/renderer/tests/fixtures/units_braz/{gen.ts,build.mjs} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
cd $S/refscript
node build.mjs           # -> gen.mjs
node gen.mjs ../out      # prints: units_braz cases=180 stored=84 sameAs=96 records=40
```

The output is deterministic: measured on 2026-10-22, two runs into separate
directories give the identical SHA-256
`1cdbab211063c4cf18db090cd06c25ae0453e8a548782d05616e4e7182749f42`
(`units_braz.json.sha256`).

## Content of `units_braz.json` (4.06 MB)

| Key | Content |
|---|---|
| `cases` (180) | full object tree (format of `tests/fixtures/unit_core`, P4.13, and `units_kamien`, P4.19): per node `kind`, `name`, `parent`, `p`/`q`/`s`, `w` (`matrixWorld`), for meshes `geo` (`vtx`, `tri`, FNV-1a `hash` of position/normal/uv/index/groups) and `mat` (`color`, linear `lin`, `metalness`, `roughness`, `transparent`, `opacity`, `flatShading`) + index in `userData['mats']`; per case `mats`, `bbox`, `meshes`, `tris`, `vertices`, `sig`, `celticRetint`, `perTokenGeos` (count). Ids: `fn:<export>` / `fn:<export>@B` (30 builders × 2 owner colours), `unit:<PL>` / `unitB:<PL>` (`buildUnitModel(categoryOf, OWNER_A / OWNER_B, PL)`), `unitEn:<PL>` (same with the EN name) for the 40 Bronze records. |
| `records` (40) | the `units.json` rows with `Epoka = Brąz`: `pl`, `en`, `category` (`categoryOf`). |

Size reduction: a `unit:`/`unitB:`/`unitEn:` case whose full record is
identical (deep JSON equality, `call` excluded) to an already stored case is
written as `{ call, sameAs: <id> }` (96 of 180); the Rust test builds its own
model for that call and compares it in full against the referenced record.

Floats are stored as IEEE-754 binary64 bits (`hx()` in `gen.ts`, 16 hex digits
per number), compared in Rust with `to_bits()`.

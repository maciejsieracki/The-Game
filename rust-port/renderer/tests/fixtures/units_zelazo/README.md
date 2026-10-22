# MOD-07 Iron unit models — reference data (R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1)

Reference vectors for `tests/units_zelazo_web_parity.rs`. Every expected value
was produced by **running the web code** of `edb8fb56`:

- `three@0.169.0` and `esbuild@0.24.0` from npm (scratch install), node
  v22.22.0 (V8 12.4);
- `gra/src/**` and `gra/data/**` from `git archive edb8fb56 gra/src gra/data`,
  **imported unchanged and without any adaptation**: the 22 exported builders
  of `render/hastati-opus5.ts`, `render/hastati-falangita.ts` (including
  `buildHastati`, reachable from no record), `render/jednostki-p6-super.ts`,
  `render/jednostki-z1-mezopotamia.ts`, `-z2-srodziemne.ts`,
  `-z3-plemiona.ts`, `render/zelazo-jezdziec-oszczepami-opus5.ts`,
  `render/zelazo-konnica-asyryjska-opus5.ts`; `buildUnitModel` of
  `render/units.ts`, `categoryOf` of `units/setup.ts`. The three MOD-07
  builders that live inside `units.ts` (`buildGaesatae`, `buildSoldurii`,
  `buildCatapult`) are not exported, so they are reached through the real
  entry point `buildUnitModel(categoryOf(...), owner, name)`.

No WebGL renderer: the builders return `THREE.Group` trees; the generator calls
`updateMatrixWorld(true)` and reads them. Owner colours: `OWNER_A = 0xd03030`,
`OWNER_B = 0x2a6fdb`.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive edb8fb56 gra/src gra/data | tar -x -C $S/websrc
cp rust-port/renderer/tests/fixtures/units_zelazo/{gen.ts,build.mjs} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
cd $S/refscript
node build.mjs           # -> gen.mjs
node gen.mjs ../out      # prints: units_zelazo cases=121 stored=53 sameAs=68 records=25
```

The output is deterministic: measured on 2026-10-22, two runs into separate
directories give the identical SHA-256
`cc657f0fecb34e3d96eabf4a3c12e170cb5673aa8a8156cff60ee2df71c28c76`
(`units_zelazo.json.sha256`).

## Content of `units_zelazo.json` (2.20 MB)

| Key | Content |
|---|---|
| `cases` (121) | full object tree (format of `tests/fixtures/unit_core`, P4.13, `units_kamien`, P4.19, `units_braz`, P4.23): per node `kind`, `name`, `parent`, `p`/`q`/`s`, `w` (`matrixWorld`), for meshes `geo` (`type`, `vtx`, `tri`, FNV-1a `hash` of position/normal/uv/index/groups) and `mat` (`color`, linear `lin`, `metalness`, `roughness`, `transparent`, `opacity`, `flatShading`) + index in `userData['mats']`; per case `mats`, `bbox`, `meshes`, `tris`, `vertices`, `sig`, `celticRetint`, `perTokenGeos` (count). Ids: `fn:<export>` / `fn:<export>@B` (22 builders × 2 owner colours), `cat:falanga` / `cat:falanga@B` (`buildUnitModel('falanga', owner)`, the category fallback `units.ts:3704`), `unit:<PL>` / `unitB:<PL>` (`buildUnitModel(categoryOf, OWNER_A / OWNER_B, PL)`), `unitEn:<PL>` (same with the EN name) for the 25 Iron records. |
| `records` (25) | the `units.json` rows with `Epoka = Żelazo`: `pl`, `en`, `category` (`categoryOf`). |

Size reduction: a case whose full record is identical (deep JSON equality,
`call` excluded) to an already stored case is written as
`{ call, sameAs: <id> }` (68 of 121); the Rust test builds its own model for
that call and compares it in full against the referenced record.

Floats are stored as IEEE-754 binary64 bits (`hx()` in `gen.ts`, 16 hex digits
per number), compared in Rust with `to_bits()`.

# MOD-05 Stone unit models — reference data (R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1)

Reference vectors for `tests/units_kamien_web_parity.rs`. Every expected value
was produced by **running the web code** of `edb8fb56`:

- `three@0.169.0` and `esbuild@0.24.0` from npm (scratch install), node
  v22.22.0 (V8 12.4);
- `gra/src/**` and `gra/data/**` from `git archive edb8fb56 gra/src gra/data`,
  **imported unchanged and without any adaptation**: the ten builders are
  exported by `render/kamien-bazowe-opus5.ts`, `render/kamien-inka-opus5.ts`,
  `render/kamien-lucznicy-opus5.ts`, `render/kamien-zulu-taran-opus5.ts`;
  `buildUnitModel` by `render/units.ts`, `categoryOf` by `units/setup.ts`.

No WebGL renderer: the builders return `THREE.Group` trees; the generator calls
`updateMatrixWorld(true)` and reads them. Owner colours: `OWNER_A = 0xd03030`,
`OWNER_B = 0x2a6fdb`.

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive edb8fb56 gra/src gra/data | tar -x -C $S/websrc
cp rust-port/renderer/tests/fixtures/units_kamien/{gen.ts,build.mjs} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
cd $S/refscript
node build.mjs           # -> gen.mjs
node gen.mjs ../out      # prints: units_kamien cases=40 records=10 asin=5027
```

The output is deterministic (two runs → identical SHA-256
`29c9793a2a395b7ca7a4989c14282c76dda339dfa597630a0fa723137f11569a`).

## Content of `units_kamien.json` (3.0 MB)

| Key | Content |
|---|---|
| `cases` (40) | full object tree (format of `tests/fixtures/unit_core`, P4.13): per node `kind`, `name`, `parent`, `p`/`q`/`s`, `w` (`matrixWorld`), for meshes `geo` (`vtx`, `tri`, FNV-1a `hash` of position/normal/uv/index/groups) and `mat` (`color`, linear `lin`, `metalness`, `roughness`, `transparent`, `opacity`, `flatShading`) + index in `userData['mats']`; per case `mats`, `bbox`, `meshes`, `tris`, `sig`, `celticRetint`, `perTokenGeos` (count). Ids: `fn:<export>` and `fn:<export>@B` (the 10 builders × 2 owner colours), `unit:<PL>` (`buildUnitModel(categoryOf, OWNER_A, PL)`), `unitEn:<PL>` (same with the EN name). |
| `records` (10) | the `units.json` rows with `Epoka = Kamień`: `pl`, `en`, `category` (`categoryOf`). |
| `asin` | 5 027 samples `x` and V8 `Math.asin(x)` (the Euler round trip of `quaternion.copy(q); rotation.y += …` in `kamien-zulu-taran-opus5.ts` goes through `Euler.setFromRotationMatrix` → `Math.asin`). |

Floats are stored as IEEE-754 binary64 bits (`hx()` in `gen.ts`, 16 hex digits
per number), compared in Rust with `to_bits()`.

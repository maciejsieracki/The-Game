# REPIN-3D-B reference vectors (`tests/repin3d_b*`)

Topic R-RUSTPORT-REPIN-3D-B-Q1 (document `dyspozycje/rust-port/p4/P4-REPIN-3D.md` §9): the map
render modules outside `battle::*` (`render/*` of the web, §2.3 of the document) re-pinned from
`edb8fb56` to the CURRENT web (`origin/main`), batch by batch. Kept in separate files
(`README_B.md`, `MANIFEST_B.sha256`) so that batch A3, running in parallel, does not share a file
with batch B.

## Batch B1: build-highlight constants + filter, mine tint, deposit scale, fort/outpost scale

`b1.json` (16 529 B, sha256 `fa57d2dd…`) — produced by `gen_b1.ts` on `origin/main` @ `86d510c66`,
three@0.169.0, esbuild@0.24.0, node v22.22.0; esbuild inputs (metafile) 45 files, 2 879 077 B.

| key | web (`origin/main`) | Rust |
|---|---|---|
| `constants` (10) | `buildHighlight.ts:2-10`, `rangeOverlay.ts:477`, `resources.ts:18`, `improvements.ts:398,408` | `models::misc::build_highlight`, `models::misc::range`, `models::improvements::{zasoby, registry}` |
| `filter` (14) | `filterBuildHighlightHexes` `buildHighlight.ts:22-28` (empty, hit/miss, duplicates, `-0`, NaN, ±∞, fractions, `1e-7`, `1e+21`, empty key, `:` in key) | `build_highlight::filter_build_highlight_hexes` |
| `jsnum` (18) | `${x}` template literal (V8 `Number.prototype.toString`) at the notation boundaries | `build_highlight::js_num` |
| `deposit` (104) | `buildStyledResourceOverlay(n, 'roblox', z)` `styleResources.ts:448-452`: `userData` keys and `depositDisplayScale`, 8 `Nakladka` × 13 `zloze` | `zasoby::build_styled_resource_overlay` |

Full model graphs for the same change (fort / outpost sectors ×2, deposit `userData`) are in the
pin-era fixtures, REGENERATED on `origin/main` with their own UNCHANGED generators:
`tests/fixtures/improvements/{models,sigs}.json` (diff vs pin: only the 32 `res:*` cases — the
`depositDisplayScale` key — and the 7 fort-containing sector layouts + `sect-full:mix-mask5`;
`legacy`, `protokeys`, `data` byte-identical) and `tests/fixtures/misc/overlays.json` (diff vs pin:
only `styles.mine.tintOpacity` and the 51 `range` cases of style `mine`; `models.json`,
`siege.json` byte-identical).

### Regeneration (outside the repository only)

```bash
S=$(mktemp -d)
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
ln -s ref/node_modules $S/node_modules
git archive --format=tar -o $S/websrc.tar origin/main gra/src gra/data && tar -xf $S/websrc.tar -C $S/websrc
cp rust-port/renderer/tests/repin3d_fixtures/gen_b1.ts $S/refscript/
cd $S/refscript
../ref/node_modules/.bin/esbuild gen_b1.ts --bundle --platform=node --format=esm --outfile=gen_b1.mjs --log-level=warning
node gen_b1.mjs ../out          # prints: b1 constants=10 filter=14 deposit=104
```

The pin-era fixtures: the commands of `tests/fixtures/improvements/README.md` and
`tests/fixtures/misc/README.md` with `origin/main` in place of `edb8fb56`.

Mutations: `python3 tests/repin3d_fixtures/mutate_b1.py` (20 mutants; `RANGE=a:b` to split).

## Batches B2 + B3: owner-medallion ring colour, plate owner icon 0,80, commander star

Topic R-RUSTPORT-REPIN-3D-B2-Q1 (document §10). Web `origin/main` @ `86d510c66`, three@0.169.0,
esbuild@0.24.0, node v22.22.0, playwright 1.56.1 + headless Chromium 141.0.7390.37.

| file | content | produced by | used by |
|---|---|---|---|
| `b2.json` (8 706 B) | `keys` 168 = 6 owner contexts × 28 `ringHex` edge cases (`ownerEmblemKey`), `consts.PLATE_OWNER_ICON_SIZE`, `textures` 13 contexts → 12 canvas textures (`ownerEmblemTexture`: portrait / sigil / fallback glyph / city-state / barbarian, with and without assets, one cache hit), `plates` 3 (`applyUnitStatPlate`: owner key + icon mesh position / scale bits) | `gen_b2.ts` + `gen_b2.mjs` (Chromium canvases; keys / constants / plates also run in node and must be identical) | `tests/repin3d_b2.rs` |
| `b2_ref/<id>[.initial].rgba` (19 × 64 KiB) | `getImageData` (straight RGBA8) of each texture after all images loaded; `.initial` = the synchronous first state when it differs | `gen_b2.mjs` | `ring_textures_match_chromium` (SSIM ≥ 0,985, mean_abs ≤ 1,5, px>16 ≤ 5 %, ring probe ≤ 3) |
| `b3.json` (29 310 B) | `applyUnitCommanderStar` on one token, 8 sequences (10 states with the badge): presence, object kept, child count, sub-tree (type, name, parent, p/r/s bits, `userData`, geometry f32 bits, material bits); coexistence with the veteran stars | `gen_b3.ts` (node) | `commander_star_matches_the_web_bit_for_bit` |

The asset inputs are `tests/fixtures/overlay/input/*` (`gen_b2.mjs` aborts unless the strings it
computes from `origin/main` are byte-identical to them).

Pin-era fixtures REGENERATED on `origin/main` with their own UNCHANGED generators:
`tests/fixtures/overlay/{overlay.json,MANIFEST.sha256}` (`gen.mjs`; diff vs pin: 104 emblem keys
`…:brass`, `consts.PLATE_OWNER_ICON_SIZE`, 58 scale + 29 position bits of the owner icon, 22 + 1 owner
keys in `userData`, 8 texture keys; every `ref/*.rgba` and `input/*` byte-identical), `golden.tsv`
re-blessed (only the key text `:brass`, hashes unchanged), `tests/fixtures/atlas/atlas_keys.json`
(`gen.sh` steps; diff vs pin: only 304 `emblemKeys[].key` `…:brass`).

### Regeneration (outside the repository only)

```bash
S=$(mktemp -d)
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
ln -s ref/node_modules $S/node_modules
git archive --format=tar -o $S/websrc.tar origin/main gra/src gra/data && tar -xf $S/websrc.tar -C $S/websrc
cp rust-port/renderer/tests/repin3d_fixtures/{gen_b2.ts,gen_b2.mjs,gen_b3.ts} $S/refscript/
ln -s $S/ref/node_modules $S/refscript/node_modules
cd $S/refscript
NODE_PATH=$S/ref/node_modules:/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
  node gen_b2.mjs ../out <repo>/rust-port/renderer/assets <repo>/rust-port/renderer/tests/fixtures/overlay/input
  # prints: b2 keys=168 textures=13 unique=12 plates=3 images=load×7 chromium=141.0.7390.37
../ref/node_modules/.bin/esbuild gen_b3.ts --bundle --platform=node --format=esm --outfile=gen_b3.mjs --log-level=warning
node gen_b3.mjs ../out          # prints: b3 cases=8 geos=1
```

Mutations: `python3 tests/repin3d_fixtures/mutate_b2.py` (30 mutants; `RANGE=a:b` to split).

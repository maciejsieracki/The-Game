# Pochodzenie danych referencyjnych `tests/fixtures/geom/*.json`

- Temat: `R-RUSTPORT-P4-8-GEOMETRY-PRIMS-Q1` (RR-T4), dokument
  `dyspozycje/rust-port/p4/P4-8-GEOMETRY-PRIMS.md`.
- Źródło: Three.js **0.169.0** (`REVISION === '169'`), pakiet npm pobrany
  `npm pack three@0.169.0` do katalogu scratchpad **poza repo**;
  sha256 tarballa `three-0.169.0.tgz`:
  `c86d0937570fb425d981e156ddf919c43dbc45d4e91fd7c8dd0de56723b3ec71`
  (npm shasum `4a62114988ad9728d73526d1f1de6760c56b4adc`).
- Node: v22.22.0.
- Generator: `gen_fixtures.mjs` (ten katalog). Uruchomienie z katalogu innego
  niż pobrany pakiet:

  ```bash
  node rust-port/renderer/tests/fixtures/geom/gen_fixtures.mjs \
       <scratch>/three-pkg/package rust-port/renderer/tests/fixtures/geom
  ```

- Skrypt importuje wyłącznie `build/three.module.js` i
  `examples/jsm/utils/BufferGeometryUtils.js` z pakietu; nie wykonuje innego
  kodu z pobranego katalogu.
- Format: `{ "three": "0.169.0", "cases": [ { name, kind, args, position,
  normal, uv, index, groups } ] }`. Bufory to dokładna zawartość
  `Float32Array` (NaN → `null`), `index` = `null` dla geometrii
  nieindeksowanej, `groups` = `[start, count, materialIndex]`.
- Ponowne uruchomienie generatora daje pliki bajtowo identyczne (sprawdzone
  `diff -r -q`, patrz dokument P4.8).
- Test: `tests/geom_three_parity.rs` (tolerancja 1e-6 dla float, indeksy i
  grupy dokładnie, determinizm bitowy).

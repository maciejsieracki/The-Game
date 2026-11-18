# R-RUSTPORT-P6-BATTLE-SETUP-Q1 — Final Control, runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-BATTLE-SETUP-Q1
GOAL: T5a — teren + mur pola bitwy oblężniczej w silniku wg pinu 07d2fbd72 (generateBattleTerrain, presetForWorldTerrain,
      battleSafeCols/battleClearSideCap, _carveBattleBox, _fencePlayableZone, _carveWallTiles, rzędy wież, impl MoveTerrain)
ZMIANY/COMMIT: oceniany stan f1bab7c31 (obrona) = kod 4ae3c51c4 + testy obrony; baza d21caf8f2 (przodek potwierdzony);
               merge-tree z bieżącym origin/rust-port/parity-v2 47af8dac3 bez konfliktów (drzewo a96ff28f5)
TESTY: fmt --check 0; clippy --all-targets -D warnings 0; p6_battle_setup 15/0/0; generator odtworzony bajt w bajt;
       pełny engine (lib+benches+530 testów integracyjnych, partiami) 4003 passed / 0 failed / 1 ignored (istniejący), FULL_EXIT=0;
       6 mutantów FC zabitych
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora na rust-port/parity-v2; potem T5b (rozstawienie jednostek) jako runda tego samego ID
DEPLOY/PUSH: NIE WYKONANO
```

## Bramki odtworzone samodzielnie

CARGO_TARGET_DIR w scratchpadzie (`bsetup-fc/target`, usunięty po bramkach), `CARGO_INCREMENTAL=0`, debug=0.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p6_battle_setup` | 15 passed, 0 failed, 0 ignored |
| `node tests/p6_battle_setup_gen.mjs` | strażnik SHA pinu OK (`a17735ed…`, `cc715ed6…`, `52fd18e9…`, fragmenty `21984ff2…`, FNV renderera `683b6817335ea8b8`), 21 scenariuszy; `vectors.json` MD5 `89b11a92710638ad178ca3b7f20e89d5`, `renderer_parity.json` MD5 `d5d76ef6b5e27a5dfd75d57f9c4f3d2c` — identyczne z commitem, `git status` czysty |
| pełny test engine | patrz niżej: EXIT 0 |

### Pełny test engine (równoważnik `cargo test --all-targets --no-fail-fast`)

Wolne miejsce na `/` w chwili startu: 4,3–5,2 GB (< 8 GB z dispatchu; równoległe tematy). Jednorazowa kompilacja wszystkich
~530 binarek testowych (~7 MB każda) zapełniłaby dysk i zabiła cudze buildy (to samo zjawisko unieważniło przebieg
Evaluatora: 237 × „never executed”). Dlatego FC uruchomiło ten sam zbiór celów partiami w tle (`setsid nohup`,
skrypt `scratchpad/bsetup-fc/bsetup_fc_full.sh`): `cargo test --no-fail-fast --lib --benches`, następnie wszystkie
`tests/*.rs` w 9 grupach po ≤ 60 `--test`, z usuwaniem binarek grupy po jej przebiegu. Zbiór celów = `--all-targets`
(crate nie ma `src/bin` ani `examples`).

* `GROUP_EXIT` lib i grp_aa…grp_ai: wszystkie 0; `FULL_EXIT=0`.
* 532 linie `test result: ok` (lib + bench + 530 plików testów), 0 `FAILED`, 0 „never executed/could not execute”.
* Suma: **4003 passed, 0 failed, 1 ignored** (`e2e::dump_tick1_econ_for_web_generator` z `tests/p6_order_lane.rs:1530`,
  istniejący przed tematem, poza diffem).

## Allowlista i zakazy (zweryfikowane `git diff --name-status d21caf8f2 f1bab7c31`)

Dodane: `engine/src/domain/battle_setup.rs`, `battle_setup_sin.rs`, `battle_setup_terrain.rs`,
`engine/tests/p6_battle_setup.rs`, `p6_battle_setup_gen.mjs`, `p6_battle_setup_vectors/{vectors,renderer_parity}.json`,
raporty runu. Zmienione: `engine/src/domain/mod.rs` — wyłącznie 3 × `pub mod`. Brak zmian w `renderer/`,
`siege_tactics_loop.rs`, `Cargo.toml`/`Cargo.lock`, `gra/**`, istniejących testach i wektorach. Brak `#[ignore]` w nowych
plikach. D-BS-3: w pinie `battleScene.ts` brak `Math.random` w liniach 2700–4200 (wycinki ustawienia pola); generator
blokuje `Math.random` wyjątkiem i sprawdza 0 wywołań. Ziarno `'bf:' + opts.teren` = pin `battleScene.ts:2798`,
`makeRng(seed + ':' + cols + 'x' + rows)` = `battle-terrain.ts:411`.

## Mutanty FC (niezależne, `scratchpad/bsetup-fc/fc_mut*.sh`, plik przywracany, drzewo czyste po przebiegu)

| Mutant | Wynik |
|---|---|
| ziarno `bf:` → `bf-` | ZABITY (2 testy) |
| kolumna muru `DEF_FRONT_COL + 4` → `+ 5` | ZABITY (3) |
| pominięcie `fence_playable_zone` | ZABITY (2) |
| kolejność fence przed carve | ZABITY (2) |
| E7 `k < BF_COLS` → `k < 31` (luka z Evaluatora) | ZABITY (1) — poprawka obrony działa |
| E11 `hi >= lo` → `hi > lo` (luka z Evaluatora) | ZABITY (1) — poprawka obrony działa |

## Orzeczenia zarzutów

| # | Zarzut (źródło) | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 1 | Pełny `cargo test --all-targets` nie zmierzony (Ev uw. 1, Obrona Z1) | ODDAL | FC zmierzyło: 4003/0/1, FULL_EXIT=0 (partiami; metoda wyżej). |
| 2 | Mutanty Evaluatora E7, E11 przeżyły (Obrona Z2) | ODDAL | Obrona dodała wektory pinu (`boxes`, przemiatanie sideCap); FC potwierdziło zabicie E7 i E11 własnym przebiegiem. |
| 3 | E10 (`match_mult` przechwytuje kropkę bez cyfry) — mutant równoważny (Obrona Z2) | ODDAL | `"N.".parse::<f64>() == "N".parse()` w Rust; jedyny konsument parsuje tak samo — wynik identyczny dla każdego wejścia. |
| 4 | Test renderera czyta tekst `field.rs` (Ev uw. 2) | ODDAL | Zgodne z dispatchem p. 4 (brak zależności od crate); FNV wycinków to strażnik dryfu renderera. |
| 5 | `js_sin` fallback dla `|x| > 2^19·π/2` (Ev uw. 3) | ODDAL | Poza ścieżką produkcyjną (`rows=156`, `|x| < ~50`), udokumentowane w nagłówku modułu; dług nieblokujący. |
| 6 | `tower_spacing: Option<i64>` (Ev uw. 4) | ODDAL | Typ z istniejącego `city_towers.rs` (poza allowlistą); dane pinu = 4. |
| 7 | Brak klucza `wieze_strzeleckie_odstep_kafli` w danych silnika, `FieldMoveTerrain` niepodpięty (Ev uw. 5) | ODDAL | Poza zakresem T5a; wpięcie = K5LOOP-WIRING (#113) / T5b. |
| 8 | Pętla pinu `_carveBattleBox` z sideCap = Infinity nie kończy się, Rust kończy na `BF_COLS` | ODDAL | W produkcji sideCap ≤ 500 (`battleClearSideCap` = `min(MAX_PER_SIDE, …)`), Infinity nieosiągalne; wynik identyczny dla każdej skończonej głębokości. |

Zero NAPRAW, zero DO DECYZJI CZŁOWIEKA → PASS-WITH-NOTES (uwagi 5–7 to długi nieblokujące do kolejki).

## Uwagi dla orkiestratora

* Dysk był < 8 GB przez całe FC; pełna bramka szła partiami, co daje ten sam zbiór celów i asercji co `--all-targets`.
  Przy integracji na nowszej bazie (47af8dac3) warto powtórzyć pełną bramkę przy ≥ 8 GB albo tą samą metodą partiami.
* Do kolejki: wpięcie `FieldMoveTerrain`/`setup_battle_field` jako produkcyjnego wołającego (T5b / #113).

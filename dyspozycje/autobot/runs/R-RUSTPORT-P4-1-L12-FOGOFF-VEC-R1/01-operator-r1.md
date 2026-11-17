# R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1 — Operator r1

STATUS: BLOCK (INFRA: tylko pełna bramka renderera; kod, wektor i bramki cząstkowe zielone)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1
GOAL: wektor `fog_off_no_reveal_awaiting` zgodny z pinem: przy wyłączonej mgle `riverRevealKeys` = null; generator, wektory i test zgodne z pinem, bez osłabiania testu.

## Ustalenie z pinu (`07d2fbd72`)

- `gra/src/main.ts:13485` `const useFogRender = fogOn || revealAllLand;`
- `main.ts:13489-13494`, gałąź `if (useFogRender)`: `setFog(vis, exploredForRender, { landReveal: revealAllLand, riverRevealKeys: startRevealKeysForRiverFog() })`. To jedyne miejsce, w którym woła się `startRevealKeysForRiverFog()` (`main.ts:13074-13080`).
- `main.ts:13505-13506`, gałąź `else`: `setFog(ALL_KEYS, ALL_KEYS);` bez opcji.
- `gra/src/render/scene.ts:3531`: `lastRiverRevealKeys = opts?.riverRevealKeys ?? null;`. Przy wyłączonej mgle scena dostaje więc `null`.

Wniosek: gdy `!useFogRender` (mgła wyłączona i bez `revealAllLand`), `riverRevealKeys` ma być `null` (None), a nie pełne. Generator w linii ok. 301 kodował `startRevealKeysForRiverFog()` niezależnie od gałęzi, więc dla `fog_off_no_reveal_awaiting` (awaiting = true, jest heks startu) podawał 16 kluczy. Pin ich nie przekazuje. Przypadek `fog_off_reveal_on` ma `useFogRender = true` (przez `revealAllLand`), więc jego klucze zostają bez zmian. `random_7` i `random_11` już miały `null` (awaiting = false).

## ZMIANY/COMMIT

Gałąź: `rust-port-wip/R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1`, baza `326fd5545` (= `origin/rust-port/parity-v2`).
Commit kodu: `cf6a0955292cad1a8cbb29e8387f592c194fa35b`. Raport jest w osobnym, kolejnym commicie.

- `rust-port/renderer/tests/reveal_l12_gen.mjs`: `riverRevealKeys` = `null`, gdy `!useFogRender`. W nagłówku jest opis z liniami pinu.
- `rust-port/renderer/tests/reveal_l12_vectors/vectors.json`: plik wygenerowany generatorem, nie ręcznie. Zmienił się tylko `dto.reveal.riverRevealKeys` dla `fog_off_no_reveal_awaiting` (z 16 kluczy na `null`). `sources` (SHA pinu) i część `web` są bez zmian.
- `rust-port/renderer/tests/reveal_l12.rs`: test jest ZAOSTRZONY, nie osłabiony. W pętli wektorów doszła asercja: przy `!fogActive` DTO producenta ma `riverRevealKeys == None`. Przypadków nie usuwano. Test `fog_off_drops_the_river_keys` zostaje bez zmian i nadal sprawdza tolerancję adaptera (klucze przy mgle wyłączonej są ignorowane).
- `rust-port/renderer/src/view/fog.rs`: zmieniony tylko komentarz doc. Dopisano, że producent zgodny z pinem wysyła tu `null`, a tolerancja adaptera zostaje. Zachowanie się nie zmienia.
- `Cargo.lock` przywrócony, nie commitowany. Commit zrobiono jawnym `git add` z allowlisty. Brak trailera z nazwą modelu (#289).

## TESTY

Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (poza repo). Target usunięty po bramkach.

| Bramka | Wynik |
|---|---|
| `node reveal_l12_gen.mjs --check` (TYPESCRIPT_JS=/opt/node-tools/node_modules/typescript/lib/typescript.js) | EXIT 0, „reveal_l12 vectors OK (28 scenarios)” (po regeneracji) |
| `cargo fmt --check` (renderer) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (renderer) | EXIT 0 |
| `cargo test --test reveal_l12` | EXIT 0, 7 passed / 0 failed |
| `cargo test --all-targets --no-fail-fast` (renderer) | NIE URUCHOMIONO: BLOCK INFRA, dysk 8,9 GB < 12 GB (`df -h /` o 20:02 UTC; na starcie było 14 GB, spadek przez inne procesy). Dispatch nakazuje w tym przypadku BLOCK INFRA. |

Czułość (po każdej próbie kod przywrócony, `cmp` potwierdził identyczność):

| Próba | Wynik |
|---|---|
| V0: stare `vectors.json` (sprzed poprawki) z nowym testem | FAIL `reveal_matches_pinned_web_vectors` (`reveal_l12.rs:122`, nowa asercja fog-off). EXIT 101 |
| (a) adapter zwraca klucze DTO przy mgle wyłączonej | FAIL `fog_off_drops_the_river_keys` (`:299`). EXIT 101 |
| (b) `river_reveal_keys: None` przy mgle włączonej | FAIL `reveal_matches_pinned_web_vectors` (`:152`) + `empty_river_keys_stay_distinct_from_none`. EXIT 101 |
| (c) `land_reveal: false` (ignorowane `reveal_all_land`) | FAIL `reveal_matches_pinned_web_vectors` (`:145`) + `reveal_requires_every_non_sea_hex_explored`. EXIT 101 |

Uwaga do (a): po poprawce żaden wektor nie podaje kluczy przy mgle wyłączonej, bo pin ich nie przekazuje. Mutację (a) łapie więc test jednostkowy `fog_off_drops_the_river_keys`, a nie pętla wektorów. Wcześniej łapał ją przypadkowo zły wektor.

## BLOKADY

- INFRA: pełna bramka `cargo test --all-targets --no-fail-fast` nieuruchomiona, bo wolny dysk 8,9 GB < 12 GB (próg renderera z dispatchu). Do ponowienia w rundzie, w której będzie ≥ 12 GB, na commicie `cf6a09552`.

RUNDY: 1/5
NASTĘPNY KROK: pełna bramka renderera po zwolnieniu dysku do ≥ 12 GB (ta sama gałąź i commit), potem Evaluator.
DEPLOY/PUSH: NIE WYKONANO

# R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1 — Evaluator r1 (adwersarialny)

STATUS: PASS-WITH-NOTES (merytorycznie; pełna bramka renderera NIE_ZMIERZONO — INFRA, dysk)
DOMAIN: GAME (renderer, wektory pinu)
TEMAT: R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1
GOAL: wektor `fog_off_no_reveal_awaiting` zgodny z pinem (`riverRevealKeys = null` przy mgle wyłączonej), bez osłabiania testu.
ZMIANY/COMMIT: oceniane `cf6a09552` (kod) + `ce5f80ded` (raport Operatora), baza `326fd5545`. Ten raport: commit lokalny bez push.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Weryfikacja pinu (07d2fbd72, przez `git show`)

- `gra/src/main.ts:13485` `const useFogRender = fogOn || revealAllLand;`
- `:13489-13494` gałąź `if (useFogRender)`: `setFog(vis, exploredForRender, { landReveal: revealAllLand, riverRevealKeys: startRevealKeysForRiverFog() })`.
- `:13505-13506` gałąź `else`: `setFog(ALL_KEYS, ALL_KEYS);` — bez opcji, `startRevealKeysForRiverFog()` niewołane.
- `gra/src/render/scene.ts:3531` `lastRiverRevealKeys = opts?.riverRevealKeys ?? null;`

Wniosek Operatora potwierdzony: przy mgle wyłączonej producent zgodny z pinem podaje `null`. Producent silnika
`rust-port/engine/src/domain/dto_bridge.rs:175-180` już zwraca `river_reveal_keys: None` w gałęzi `!fog_active`,
więc nowy wektor jest spójny z produkcyjnym wołającym (DTO-BRIDGE).

## Bramki odtworzone (CARGO_INCREMENTAL=0, DEBUG=0, CARGO_TARGET_DIR w scratchpadzie, usunięty)

| Bramka | EXIT |
|---|---|
| `node reveal_l12_gen.mjs --check` (TYPESCRIPT_JS=/opt/node-tools/...) | 0 (28 scenariuszy) |
| `cargo fmt --check` (renderer) | 0 |
| `cargo clippy --all-targets -- -D warnings` (renderer) | 0 |
| `cargo test --lib` (renderer) | 0 (111 passed, 0 ignored) |
| `cargo test --test reveal_l12` | 0 (7/7, 0 ignored) |
| `cargo test --all-targets --no-fail-fast` (renderer) | NIE URUCHOMIONE — dysk 5,7–5,9 GB < 12 GB (próg dispatchu); dwa obce `cargo test --all-targets` engine w toku (PID 10224, 25280) |

`git diff --check 326fd5545 ce5f80ded`: czysto. Cargo.lock zmieniony lokalnie przez cargo — przywrócony, niecommitowany.

## Mutacje (wykonane samodzielnie, plik przywrócony, `cmp` OK)

- (a) adapter zwraca klucze przy mgle wyłączonej → FAIL `fog_off_drops_the_river_keys` (EXIT 101).
- (b) `river_reveal_keys: None` przy mgle włączonej → FAIL `reveal_matches_pinned_web_vectors` + `empty_river_keys_stay_distinct_from_none` (EXIT 101).
- (c) pominięta kontrola `reveal_all_land` (`if false && …`) → FAIL `reveal_matches_pinned_web_vectors` + `reveal_requires_every_non_sea_hex_explored` (EXIT 101).

## Allowlista i integralność testu

- Zmienione pliki: `reveal_l12_gen.mjs`, `reveal_l12_vectors/vectors.json`, `reveal_l12.rs`, `view/fog.rs` (wyłącznie doc-komentarz), `runs/...` — wszystkie w allowliście. Engine/view-model nietknięte.
- Brak `#[ignore]`; żadna asercja nie została usunięta ani osłabiona; dodana asercja `None` przy `!fogActive` (zaostrzenie). Liczba scenariuszy bez zmian (28).
- Diff `vectors.json` dotyczy wyłącznie `fog_off_no_reveal_awaiting.dto.reveal.riverRevealKeys` (16 kluczy → `null`); wynik `--check` potwierdza, że plik jest wyjściem generatora.
- Generator wykonuje tekst pinu (`git show 07d2fbd72`, `transpileModule`) dla `startRevealKeysForRiverFog`, `computeVisibleAt` itd.
- Commity bez linii `Co-Authored-By` (#289 spełnione).

## Zarzuty (ponumerowane)

1. **[BLOKUJĄCY dla READY, INFRA]** Pełna bramka `cargo test --all-targets --no-fail-fast` renderera nie została uruchomiona ani przez Operatora, ani przez Evaluatora (dysk 5,7–5,9 GB < 12 GB z dispatchu). Do ponowienia na `cf6a09552` przed integracją.
2. **[UWAGA, dla orkiestratora]** Zmierzony target renderera bez feature `gpu` (clippy + test --lib + reveal_l12) = 202 MB; próg 12 GB dla tego tematu wydaje się nadmiarowy. Decyzja techniczna orkiestratora (ew. obniżenie progu dla bramki renderera bez `gpu`) — nie zmieniam go sam.
3. **[NISKI]** Wybór gałęzi `useFogRender` w generatorze (`!useFogRender || r.startReveal === undefined ? null : …`) jest zakodowany ręcznie, a nie wykonany z tekstu `refreshFog` pinu; zgodność z `main.ts:13489-13506` sprawdzona przeze mnie ręcznie (patrz wyżej). Akceptowalne, ale nie jest „wykonaniem pinu”.
4. **[NISKI]** Mutację (a) łapie wyłącznie test ręczny `fog_off_drops_the_river_keys`; wektory pinu z definicji nie mogą już nieść kluczy przy mgle wyłączonej. Ograniczenie wynikające z pinu, nie wada pracy.
5. **[NISKI, poza allowlistą]** Doc-komentarz `view-model/src/map.rs:232-252` (`FogRevealDto::river_reveal_keys`) nie wspomina, że przy mgle wyłączonej pole jest `None` (`main.ts:13506`). Kandydat na osobny dług dokumentacyjny.

## NASTĘPNY KROK
Obrona/Final Control; przed integracją pełna bramka renderera na `cf6a09552` po spełnieniu progu dysku (lub po decyzji orkiestratora wg zarzutu 2).

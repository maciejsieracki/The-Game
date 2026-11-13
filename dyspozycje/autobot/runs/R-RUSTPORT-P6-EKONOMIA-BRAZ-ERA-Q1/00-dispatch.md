# DISPATCH R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1 (runda 1)

TEMAT: EKONOMIA-BRAZ-ERA (#15 / T-A): przepustowość brązu per epoka — implementacja
DOMENA: GAME (implementacja). BAZA: `5e8b116e8` (czubek `origin/rust-port/parity-v2`). Worktree na `wip/R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1`. Przed startem: `git checkout --detach 5e8b116e8` w worktree (ten SHA ma pierwszeństwo nad wszelkimi innymi).
Pin (tylko odczyt): `git show 07d2fbd72:<ścieżka>`.

## GOAL
Wdrożyć przepustowość brązu per epoka 1:1 z pinu: klucze `throughputEraParamKeys` (converters.ts:99,100,102; konsument :178-183, :226) oraz zbiór receptur `CONVERTER_FOUNDRY_ERA_RECIPE_IDS` (converters.ts:148-152, 3 wpisy). Zastąpić stan Rust (turn_economy_resources.rs:151-158 ma 6 wpisów; :186 mnoży m(e) także brąz). Parytet z wersją webową: gameplay wdrażamy 1:1 wg pina `07d2fbd72` (`gra/src`). Nie zmieniać zachowania poza pinem. Źródło rozpoznania: `dyspozycje/rust-port/p6/R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1-ROZPOZNANIE.md` (sekcja korekty brązu).

## ALLOWLISTA
- `rust-port/engine/src/domain/turn_economy_resources.rs (zmiany tylko w zakresie brązu per epoka)`
- `rust-port/engine/src/data/** tylko jeśli klucze przepustowości są tam czytane (uzasadnić w raporcie)`
- `rust-port/engine/tests/p6_ekonomia_braz_era*.rs (NOWE)`
- `rust-port/engine/tests/p6_ekonomia_braz_era_gen.mjs (NOWY, generator wykonujący tekst pina)`
- `rust-port/engine/tests/p6_ekonomia_braz_era_vectors/** (NOWE, wygenerowane generatorem)`
- `dyspozycje/autobot/runs/<ID>/**`
ZAKAZ: `gra/**`, `Cargo.toml`, `Cargo.lock`, push do rust-port/parity-v2, osłabianie istniejących asercji, `#[ignore]`.

## KRYTERIA KOŃCA
1) Wektory z pinu (generator .mjs wykonuje pin, nie ręczne liczby), SHA fragmentu pina w teście. 2) `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`, nowe testy — zielone z kodami wyjścia. 3) Pełny `cargo test --no-fail-fast` przed FC (0 failed). 4) Każda zmiana oczekiwań istniejących testów opisana w raporcie z uzasadnieniem.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (kody wyjścia)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Operator: Haiku. Pełna bramka przed commitem. Commit bez linii Co-Authored-By z nazwą modelu, z `Claude-Session`. RUNDY: 1/5.

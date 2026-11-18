# R-RUSTPORT-P6-BATTLE-SETUP-Q1 — ustawienie pola bitwy oblężniczej w silniku (T5a: teren i mur)

STATUS: dispatch orkiestratora. Opus (3D), wszystkie etapy Opus. Podstawa: rozpoznanie `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-WIRING-ROZP-Q1/00-rozpoznanie.md` §3 (wiersz T5), §4 (D-WIR-4), §5 (ryzyka). Czytaj je PIERWSZE.
BAZA: `origin/rust-port/parity-v2` w chwili startu (wpisz SHA w raporcie; po integracji K5LOOP r4 ma być nowsza, ale ten temat nie dotyka `siege_tactics_loop.rs`). Przed startem: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## GOAL (runda 1 = T5a: teren + mur; T5b rozstawienie jednostek = osobna runda tego samego ID po FC)
Domena silnika, która produkuje pole bitwy jak pin `07d2fbd72` (WEB NAJPIERW — czytaj `git show 07d2fbd72:gra/src/...`, przede wszystkim `battle-terrain.ts` (generateBattleTerrain, `:403`, ziarno `'bf:' + teren`), presetForWorldTerrain, battleSafeCols/battleClearSideCap oraz w `battleScene.ts` `_carveBattleBox`, `_fencePlayableZone`, `_carveWallTiles`, rzędy wież):
1. `generateBattleTerrain` + `presetForWorldTerrain` + `battleSafeCols`/`battleClearSideCap`;
2. `_carveBattleBox`, `_fencePlayableZone`, `_carveWallTiles` (mur/palisada/cytadela) i rzędy wież;
3. `impl MoveTerrain` produkcyjny na wygenerowanej siatce (dziś istnieje tylko w testach; wymaganie #113);
4. równość z `renderer/src/battle/field.rs::carve_wall_tiles` i `tile_jitter` WYŁĄCZNIE przez fiksturę JSON (test w engine NIE może zależeć od crate renderera; renderera nie zmieniaj).
## DECYZJE (D-BS-1..3, techniczne)
- D-BS-1: logika pola należy do silnika (D-WIR-4); renderer zostaje konsumentem `BattleSetupDto` w osobnym temacie.
- D-BS-2: generator wykonuje TEKST pinu (TS, jak `p6_k5loop_close_r3_gen.mjs`), strażnik SHA fragmentów pinu; wektory w `engine/tests/p6_battle_setup_vectors/`.
- D-BS-3: RNG/ziarno wyłącznie deterministyczne wg pinu (bez `Math.random`); jeśli pin używa `Math.random` w ustawieniu, wypisz to jawnie w raporcie (NIE zgaduj).
## ALLOWLISTA
Nowe: `rust-port/engine/src/domain/battle_setup*.rs`, `rust-port/engine/tests/p6_battle_setup*.rs`, `rust-port/engine/tests/p6_battle_setup_gen.mjs`, `rust-port/engine/tests/p6_battle_setup_vectors/*`. Zmiana: `rust-port/engine/src/domain/mod.rs` (tylko `pub mod`). Raporty w katalogu runu. NIE ruszaj: `renderer/`, `siege_tactics_loop.rs`, `Cargo.toml`/`Cargo.lock`, `gra/**`, istniejących testów i wektorów.
## KRYTERIA KOŃCA
>= 6 scenariuszy zgodnych z pinem (z/bez presetu, różne liczności, mur/palisada/cytadela, każdy teren świata z mapy presetów), wszystkie bajt w bajt wg wykonania tekstu pinu; fixtura równości z `carve_wall_tiles`/`tile_jitter`; `impl MoveTerrain` testowany; mutanty (zmiana kolejności rzutów/ziarna, pominięcie wycięcia, offset muru, preset) giną; NaN/Inf w liczności jednostek nie zawiesza (strażnik czasu w testach).
## BRAMKI (EXIT 0)
`cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; nowe testy; pełny `cargo test --all-targets --no-fail-fast` w tle (`setsid nohup`, EXIT w logu). Dysk >= 8 GB przed pełną bramką; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`; unikalny podkatalog scratchpadu `bsetup/…` (NIE używaj wspólnych nazw typu `gates.sh`), target usuń po bramkach.
## ZAKAZY
Brak `#[ignore]`, brak osłabiania asercji, brak zmian zachowania istniejących modułów, brak push/deploy, brak linii Co-Authored-By z nazwą modelu. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; po FC integruje orkiestrator.

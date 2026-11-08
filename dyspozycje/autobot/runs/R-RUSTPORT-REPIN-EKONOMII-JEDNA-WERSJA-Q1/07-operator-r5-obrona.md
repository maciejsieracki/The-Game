# R-RUSTPORT-REPIN-EKONOMII-JEDNA-WERSJA-Q1 — obrona zarzutow Evaluatora r5 (Haiku, obrona)

STATUS: OBRONA-ZAKONCZONA (bez zmian kodu; zarzuty 1-3 i 5 przyjete z dowodami, zarzut 4 czesciowo)
BAZA: 5776e1334 (Operator r5). Worktree wf_107919b4-5d6-3, detached. PUSH NIE WYKONANO.

## Odpowiedzi na zarzuty

Z1 (pin hybrid2 zamiast origin/main) — PRZYJMUJE jako ZALOZENIE Z-R5-1 (odstepstwo od decyzji orkiestratora, do akceptacji).
Dowod: 05-operator-r4.md sekcja 8.2 (pin origin/main: FAIL pieniadz ef-1 city23 rust=18 web=17; FAIL popCap ef-0 city3 rust=21 web=13).
Roznice web 4bbef081d..origin/main i 331ef699b..origin/main (git diff --stat, 2026-11-08):
- gra/src/game/trade-routes.ts: 306 linii (handel morski),
- gra/data/buildings.json: 79 linii (popCap, Port),
- gra/src/game/turn-economy.ts: 22 linie (R-WEB-CITYSTATE-UPKEEP-DIFFICULTY-Q1: utrzymanie per owner wg poziomu trudnosci; Rust tego nie ma),
- gra/src/game/terrain-improvements.ts: z origin/main (w hybrid2 zgodny).
Wniosek: Rust NIE jest jeszcze 1:1 z origin/main w handlu morskim, popCap i utrzymaniu per owner. To jest dlug Rust-vs-web (D-R4-1 + nowy D-R5-2), a nie blad wektorow. Pin origin/main oznaczalby czerwone p6_empirefood_e2e bez mozliwosci zielonego zamkniecia w tym temacie.
Zasieg testu p6_repin_ekonomii_era: pin hybrid2 (generator: tools/gen-p6-repin-ekonomii-era-vectors.mjs, argument WEB_REF). Dotyczy kafelkow (tileYield), ktore korzystaja z economy.ts (bez roznic 331ef699b vs origin/main) i terrain-improvements.ts (origin/main). Nie dotyczy turn-economy.ts ani trade-routes.ts.

Z2 (D niedomkniete, resource_production.rs) — PRZYJMUJE jako dlug D-R5-1; nie da sie usunac w allowliscie.
Dowod (git grep, 5776e1334): symbole *_all_producers wystepuja tylko w komentarzu improvements.rs:958. Stara rodzina u32/u8 w resource_production.rs (stack_resource_production, resource_production_amount_for_era, territory_resource_yield_for_improvement(key,u8), resource_yield_for_improvement, resource_production_for, resolve_resource_production) ma wolajacych wylacznie: tests/resource_production.rs, tests/parity_suite.rs, benches/engine_modules.rs (spoza allowlisty). Live kod uzywa z tego modulu tylko citizen_* i citizen_consumption_era_multiplier (turn_economy_resources.rs, order_effects_lane.rs, city_growth.rs) — te zostaja.
Usuniecie wymaga edycji 3 plikow poza allowlista: decyzja orkiestratora.
Uwaga przy okazji (jawnie): w tests/p6_repin_autoimpr_terrain.rs usunieto jeden blok asercji porownujacy z legacy migawka (tartak/kamieniolom) — jedyna usunieta asercja w diffie testow (grep '^-' + assert = 1 linia). Blok byl zwiazany z usunieta migawka; asercja wobec weba (era-scaling, `same(got, out)`) zostaje.

Z3 (naruszenie allowlisty: tests/economy_city_vectors_r3.rs, r4.rs, +1 linia `wlasciciel_era: None`) — PRZYJMUJE jako fakt; prosze o wyjatek w decyzji orkiestratora.
Zmiana jest neutralna dla zachowania (None = dotychczasowa galezia apply_improvement_bonuses, wektory r3/r4 zielone). Konsekwencja dodania pola do WorkedTileImpInput (literaly w testach poza allowlista).
Alternatywa bez ruszania testow (osobne funkcje *_era dla tile_yield_full i city_terrain_sums_imp_full oraz wywolan w turn_economy_loop) wymaga zmian sygnatur w economy_yield.rs i turn_economy_loop.rs, nie wykonano: wykracza poza temat.

Z4 (wektory z weba bez pelnej korelacji pole-po-polu) — CZESCIOWO PRZYJMUJE: pelnej korelacji nie powtorzono (NIE_ZMIERZONO). Dowod wykonany: test p6_repin_ekonomii_era porownuje 1760 kafelkow bit-w-bit z wektorem z weba (pin hybrid2); jedyna usunieta asercja to blok legacy opisany w Z2. Zmiany wektorow: jednowierszowe pliki JSON, roznice wylacznie w polach out (zgodne ze skalowaniem epoka, opisane w 05-operator-r4.md i w P6-REPIN-EKONOMII.md sekcja 9.2).

Z5 (p6_8i_pick nie zmierzony; baseline pre-B1 nie zmierzony) — CZESCIOWO PRZYJMUJE.
- p6_8i_pick: ZMIERZONE w tej obronie na 5776e1334: `cargo test --test p6_8i_pick` = 5 passed, 0 failed, finished in 404.93 s (kompilacja 45 s, CARGO_INCREMENTAL=0, CARGO_PROFILE_*_DEBUG=0, CARGO_TARGET_DIR w worktree, usuniety po bramce).
- Baseline pre-B1 pelnej sumy: NIE_ZMIERZONO. Powod: pelny przebieg 300 binarek wymaga ~godziny i ponownej kompilacji calosci na 707b50c41; wolne 4,3-5,3 GB. Nie wykonano.
- Rozbieznosc liczby binarek: tests/*.rs = 300 (z p6_8i_pick = 299 bez niego). Raport r5 podal 298 binarek / 2226 passed; Evaluator 299 / 2228 passed. Roznica 2 passed odpowiada 2 testom p6_repin_ekonomii_era. NIE_ZMIERZONO ponownie: nie odtworzono pelnej sumy.

## Nowe dlugi
- D-R5-1: rodzina resource_production.rs (u32/u8) — usuniecie po decyzji o allowlistcie (tests/resource_production.rs, tests/parity_suite.rs, benches/engine_modules.rs).
- D-R5-2: utrzymanie per owner wg poziomu trudnosci (turn-economy.ts, R-WEB-CITYSTATE-UPKEEP-DIFFICULTY-Q1) — brak w Rust; poza tym tematem.
- Z-R5-1 / D-R4-1: pin hybrid2 zamiast origin/main; handel morski, popCap — do akceptacji albo osobny temat.

## Bramki
- Brak zmian kodu w tej obronie (commit tylko raportu). Bramki z r5 (fmt, clippy, lib 22/0, per binarka) nie zmieniane.
- p6_8i_pick 5/0 (404.93 s), SHA 5776e1334.

STATUS: PASS-WITH-NOTES (runda 4/5, Operator Sonnet 5.5; uzasadnienie modelu: 2 nieudane rundy Haiku, bisekcja regresji w ekonomii przez wiele plikow)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-EKONOMIA-CERAMIKA-GARNCARSTWO-Q1
GOAL: REPIN web 638e90bea: utrzymanie surowcowe (utrzymanie_surowce + model proporcjonalny ratio), Garncarstwo 5. po czterech podstawach (40 PN), Ha'amonga bez martwych bonusow, dane z weba; testy z wektorami z uruchomionego weba; bramki zielone.
ZMIANY-COMMIT (BAZA 14cad6f15 = kod operatora r3, przodek HEAD ZMIERZONO `merge-base --is-ancestor`; PUSH NIE):
 - 67925d8d6: wektory q5/q6/empirefood/order_lane zregenerowane z uruchomionego weba; nowy test `p6_repin_ekonomia_ceramika_web` (5 testow) + `p6_repin_ekonomia_ceramika_vectors/web.json`; generatory/przepis w runie (gen-repin-ekonomia-ceramika-vectors.mjs, mkgen-r4.py, regen-vectors-r4.sh, mk-r4-pins.sh, REGEN-WEKTOROW-R4.txt)
 - 4ca1f07ab: `tests/building_costs.rs` (43 budynki z Emporion; koszt palac_iii 560/560/560) — plik POZA ratyfikowana allowlista (konieczny do "0 failed"; do akceptacji)
 - 52977d109: dyspozycje/rust-port/p6/P6-REPIN-EKONOMIA-CERAMIKA.md (sekcja 4)
 - + commit z tym raportem (SHA w odpowiedzi orkiestratora/na koncu `git log`).
 src/ i data/ z r3 NIE zmieniane (logika upkeep = web 1:1, ZMIERZONO przez porownanie z economy-upkeep.ts:688,716-748). Zero zmian w gra/**, WERSJE.md, Cargo.toml, renderer, src-tauri (ZMIERZONO `diff --name-only 43f4064b0 HEAD`).
TESTY (CARGO_INCREMENTAL=0, CARGO_PROFILE_*_DEBUG=0, CARGO_TARGET_DIR w worktree):
 - fmt --check: OK; clippy --all-targets -D warnings: OK (exit 0); lib 22/0; doc 0/0.
 - cargo test --no-fail-fast per binarka: 324 plikow tests/ w 7 partiach <=570 s: 0 failed, 1 ignored (istniejacy p6_order_lane.rs, 0 nowych #[ignore]); suma ok. 2375 passed (sumy partii, nie jeden przebieg).
 - TABELA czerwone -> zielone (stan wejsciowy = HEAD r3 14cad6f15; dispatch r4 podawal 2 testy q5 + q6/empirefood/order_lane):
   p6_adv_q5_tick 2/2: czerwone (klucze resourceUpkeep cegla; plain-0 b0 52 vs 45; live-0 a0 121 vs 139) -> ZIELONE (wektory z weba, src bez zmian)
   p6_adv_q6_wire 2/2: czerwone -> ZIELONE (wektory z weba)
   p6_empirefood_e2e 2/2: czerwone -> ZIELONE (wektory z weba)
   p6_order_lane 10/10 (+1 ignore istniejacy): czerwone -> ZIELONE (regeneracja 2-fazowa)
   building_costs 10/10: czerwone (42 vs 43; palac_iii) -> ZIELONE
   p6_repin_ekonomia_ceramika_web 5/5: NOWE, zielone; p6_repin_ekonomia_ceramika_data 4/4 zielone.
 - Baseline na 43f4064b0: NIE_ZMIERZONO w r4 (nie uruchamiano starego drzewa; sumy z r5 REPIN-EKONOMII-JEDNA-WERSJA: 2226 passed).
 - merge-tree z origin/rust-port/parity-v2 (dzis d2d533a77, dispatch podawal 3b15849b5): BEZ konfliktow (`git merge-tree --write-tree --name-only` -> drzewo dfeb3d62d, zero plikow konfliktowych). r4 NIE merguje.
BISEKCJA REGRESJI (zad. 1): NIE jest to regresja src/danych tematu. ZMIERZONO: 3 pliki src (turn_economy.rs, turn_economy_tick.rs, economy_society.rs, buildings_tech.rs) = przeniesienie web economy-upkeep.ts:688,716-748 (ratio, utrzymanie_surowce); q5 przechodzi po regeneracji bez zmiany src. Przyczyna czerwieni = (a) wektory w pinie hybrid2 f873221ee (model 5/typ, stare koszt_surowce) oraz (b) proba regeneracji z calego 638e90bea ujawnia dryf weba POZA zakresem tematu. Sprawcy dryfu (kazdy potwierdzony eksperymentem na wektorach):
 1. korupcja Palac II/III + Trybunal (economy.ts:1226; Rust domain/economy_city_fns.rs:220 ma 3 id) — 53 scen. q5
 2. odlewnie brazu 25/50 jawne wiersze econ-params (converters.ts, R-WEB-BRONZE-FOUNDRY-OUTPUT-25-50-Q1; Rust m(e)) — q5 altdata-2, tail-8, live-32 (live-32: Rust 75 cykli brazu zjada drewno przed Garncarnia)
 3. handel kontaktowy + emporion (trade-routes.ts; Rust domain/trade.rs:345) — q6 52, empirefood 65 scen. (pieniadz +1)
 4. lodzie rybackie 6/6/6, units.json (fieldPower, Rydwan), terrain-yields, resources (uwagi)
ZALOZENIE Z-R4-1 (do akceptacji): wektory regenerowane na pinie hybrid2 (f873221ee = pin poprzednich wektorow; lokalny ref refs/ekonf/hybrid2, obiekt dostepny w repo) + NAKLADKA zakresu tematu z 638e90bea: dane buildings/tech/wonders/econ-params, economy-upkeep.ts, turn-economy.ts, converters.ts z przywroconym modelem odlewni (mk-r4-pins.sh), units pinned (zgodnie z dispatchem: units.json/unit_table nie ruszane). Dryf 1-4 = osobne tematy REPIN (dlug, NIE zamykany tu): korupcja (economy_city_fns.rs), odlewnie brazu, handel kontaktowy (trade.rs + emporion w TRADE_BUILDING_IDS), lodzie 6/6/6.
WEKTORY TEMATU Z WEBA (zad. 3): `gen-repin-ekonomia-ceramika-vectors.mjs` uruchamia web 638e90bea (Node 22, loader TS): buildingResourceUpkeep 43 budynki x 4 poziomy x 5 ratio (860 przypadkow, ceramika=4 budynki), techCost/parsePrereqs/availableTechs/cheapestAvailable (Garncarstwo 40 PN; dostepne dopiero po 4 podstawach: 16 podzbiorow), sumWonderCityYieldsForOwner + bonusy.teren dla 19 cudow (Ha'amonga bez lowie_rybackie/laka). Rust porownywany z wynikiem funkcji weba, nie asercje na JSON.
BLOKADY: brak. Poza allowlista (do ratyfikacji): tests/building_costs.rs; dlug dryfu (wyzej).
RUNDY: 4/5 (r1 BLOCK, r2/r3 FAIL Haiku, r4 Sonnet)
NASTEPNY KROK: Evaluator -> Obrona -> Final Control; decyzja orkiestratora o Z-R4-1 i o tematach REPIN dla dryfu 1-4.
DEPLOY-PUSH: NIE WYKONANO

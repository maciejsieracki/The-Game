STATUS: FAIL (runda 3/5 -> runda 4, to samo ID; baseline zmierzony, B2 niewykonane, C/D nie rozpoczęte)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-EKONOMII-JEDNA-WERSJA-Q1
GOAL: jedna wersja reguł ekonomii 1:1 z webem origin/main, użyta w turn_economy; usunięte martwe duplikaty po przepięciu.
ZMIANY/COMMIT: BAZA 64324a3b5 (origin/rust-port-wip/rekon-r2-fc, detached). Kod bez zmian (HEAD kodu = 9612c0b8e B1). Commit tylko tego raportu (plik 04-operator-r3.md; nazwa 04 zamiast 01 z dispatchu, bo 01 i 02 i 03 są rekordami r1/r2/FC r2 i nie nadpisuję ich). PUSH NIE WYKONANO.
Dysk: start 5,8 GB, po bramkach 3,0 GB (min.), po sprzątaniu target 4,3 GB. Worktree przełączony na sparse (rust-port, dyspozycje).

TESTY (CARGO_INCREMENTAL=0, CARGO_PROFILE_*_DEBUG=0, CARGO_TARGET_DIR w worktree, target usunięty po bramkach):
- cargo fmt --check: exit 0.
- cargo clippy --all-targets -- -D warnings: exit 0 (civ-engine, 1m19s).
- cargo test --no-run: 300 binarek zbudowanych.
- cargo test per binarka (300 uruchomień, 4 równolegle): 299 binarek z wynikiem; passed=2242, failed=6, ignored=1. Jedna binarka p6_8i_pick (test pick_auto_improvements_matches_pinned_web_vectors, "running for over 60 seconds") przerwana timeoutem 400 s (rc=124), bez wyniku: NIE_ZMIERZONO sumy.
- #[ignore] w źródle: 1 (rust-port/engine/tests/p6_order_lane.rs:1530), zgodnie z baseline.
- 6 FAIL (wszystkie po B1, 5 binarek; ich wektory to pin webu sprzed skalowania ulepszeń):
  p6_adv_q2a_pipeline: advance_with_map_matches_running_web, direct_calls_with_fort_and_outpost_nodes_match_web;
  p6_adv_q4_pipeline: city_loop_matches_running_web; p6_adv_q4_preview: preview_pipeline_matches_running_web;
  p6_adv_q6_wire: game_economy_wiring_matches_running_web; p6_empirefood_e2e: empire_food_block_matches_running_web (ef-3 city01 glina: rust=75 web=50).
- ATRYBUCJA (dowód): tymczasowo przywrócony turn_economy_territory.rs z 707b50c41 (pre-B1), przebudowa 5 binarek: WSZYSTKIE 5 przechodzi (12 testów, 0 failed). Plik przywrócony z HEAD (git checkout), status czysty.

POMIARY (A, domknięte, źródło: origin/main gra/src/game/terrain-improvements.ts, gra/data):
- Zbiór 9 kluczy: Rust terytorium.ulepszenia (derived/ulepszenia-reguly.json) == web TERRITORY_YIELD_IMPROVEMENTS. ZGODNE. Mapowanie surowców zgodne (kopalnia_cyny->ruda_cyny, warzelnia_soli->sol, stadnina->kon, kopalnia_zlota->zloto).
- Fallback: web TERRITORY_YIELD_DEFAULT_AMOUNT = 10 (literał); Rust domyslna_ilosc = 10 (derived JSON, brak w gra/data). Wartość zgodna, źródło różne.
- null (web) vs None (Rust): ta sama semantyka.
- order_effects_lane.rs importuje z resource_production wyłącznie compute_citizen_resource_drain i CitizenResourceDrainResult (rodzina u32/u8 produkcji NIE jest używana tam). Rodzina T produkcji żyje tylko w resource_production.rs i testach.

BLOKADY:
1. B2 (regeneracja wektorów z weba) NIE wykonane. Generatory (gen-p6-*.mjs w runs/) są przypięte do starych pinów (4bbef081d, 23dd158e9) i instrumentują kod webu po nazwach. Próba: gen-p6-empirefood-vectors.mjs z pinem origin/main (247f1ef2a) pada w instrumentacji (TypeError: builtByCity.get na web-bundle.mjs:15268). Regeneracja wymaga przepisania instrumentacji dla każdej z 5 rodzin + ewentualnie data/ (econ-params) — poza tą rundą. Wniosek (ZAŁOŻENIE, niezweryfikowane generatorem): wektor pinowany daje glinianka=50 w epoce 2, Rust po B1 daje 75 zgodnie z regułą skalowania ×1,5 z origin/main; czerwień wygląda na dług wektorów, nie na błąd B1.
2. Test pick_auto_improvements_matches_pinned_web_vectors >400 s w debug (rc=124). Nie diagnozowany.
3. C (epoka w economy_yield.rs) i D (usunięcie duplikatów) NIE rozpoczęte. Pomiar: economy_yield.rs nie ma pojęcia epoki. D wymaga allowlisty improvements.rs i resource_production.rs (decyzja orkiestratora z dispatchu r3 — brak potwierdzenia w wejściu).
4. Zgodnie z dispatchem D tylko po zielonych bramkach: bramki są czerwone (6 FAIL), więc D nie wykonano.

RUNDY: 3/5 (FAIL -> wraca do tego samego ID)
NASTĘPNY KROK: r4: (a) przepisać instrumentację generatorów pod origin/main albo wskazać pin webu z już istniejącą instrumentacją, którego skalowanie ulepszeń jest zgodne z B1; wygenerować 5 zestawów wektorów i zaktualizować testy; (b) zdiagnozować p6_8i_pick (>400 s); (c) dopiero potem C i D. Decyzja właściciela/orkiestratora potrzebna: czy pin wektorów ma być origin/main (wymaga przepisania instrumentacji) czy starszy pin z już działającą instrumentacją.
DEPLOY/PUSH: NIE WYKONANO

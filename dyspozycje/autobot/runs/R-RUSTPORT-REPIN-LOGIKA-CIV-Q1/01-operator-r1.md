STATUS: BLOCK (techniczny: 2 asercje testowe kodyfikują stan edb8fb56; 7 wektorów p6_4 wymaga regeneracji z 91dc998a; poza allowlistą edycja testów)
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-LOGIKA-CIV-Q1
GOAL: Port logiki cywilizacji z weba 91dc998a (civ-bonuses.ts, civ-ai-data.ts, civ-matrix-semantic.ts) do Rust; 12 czerwonych REPIN-DANE r2 zielonych bez osłabiania testów.
ZMIANY-COMMIT: commit a7590add (detached na `origin/rust-port/repin-wip` 829a8c0f, PUSH NIE). Pliki: rust-port/engine/src/domain/civ_bonuses.rs, src/domain/civ_matrix.rs, data/derived/{civ-bonus-matrix-specs,civ-matrix-params,civ-matrix-semantic}.json, dyspozycje/rust-port/p6/P6-REPIN-LOGIKA-CIV.md (nowy), run folder. POZA ALLOWLISTĄ (ZAŁOŻENIE, do potwierdzenia przez FC): src/data/derived.rs (pola schematu tabel; bez nich JSON nie parsuje się).
TESTY:
- fmt: EXIT=0 (po cargo fmt --all) — logi/fmt-r1.log
- clippy --all-targets -D warnings: EXIT=0 — clippy-r1.log
- cargo test --no-fail-fast --all-targets: EXIT=101; 1208 passed / 10 failed (suma 1218; r2: 1195/12, różnica liczenia NIE_ZMIERZONO) — test-r1.log
- Zielone z 12 celów: 11/12 (p6_1d 4/5; p6_1e_civ_matrix 7/7 celów).
- Pozostaje czerwony z celu: p6_1d_civ_bonuses::bonus_applies_and_stat_multipliers_match_web, tests/p6_1d_civ_bonuses.rs:339 `nonzero_records > 300`, wynik „niezerowych: 106”. Wszystkie porównania per rekord z web przechodzą.
- Nowe czerwone (regresje wymuszone przez web 91dc998a, nie przez błąd portu):
  - p6_1e_civ_matrix::ai_fallback_branches_are_actually_exercised, tests/p6_1e_civ_matrix.rs:1296 — test oczekuje legacy profilu Zulusów z civ-ai.json; web 91dc998a civ-ai-data.ts civAiProfileFor zwraca undefined.
  - p6_4_core ×2, p6_4_march ×3, p6_4_vectors ×2 (move_cost_fn_for, execute_march_step) — fixtures z edb8fb56 mają cel „wszystko” dla walka_ruch_piechota_teren_plytkie_morze; web 91dc998a bramka isKnown wymaga „piechota”. Wymaga regeneracji wektorów p6_4 z 91dc998a (poza allowlistą).
  - p6_1e_tables::semantic_table_sets_reference_existing_parameters_and_are_disjoint, tests/p6_1e_tables.rs:113 (zbiór decision_required pusty w web) oraz ::semantic_table_has_text_for_every_status_and_placeholder, :178 (dip_nastawienie_bazowe w wyjatkach DECISION_REQUIRED, brak w zbiorze) — web 91dc998a ma zbiory puste.
BLOKADY: (1) testy kodyfikujące edb8fb56 (p6_1d:339, p6_1e_civ_matrix:1296, p6_1e_tables:113 i :178) wymagają edycji asercji, co łamie zasadę „testy tylko dopiski”; (2) p6_4 wymaga regeneracji wektorów z 91dc998a poza allowlistą; (3) derived.rs poza allowlistą. Decyzja właściciela/FC potrzebna — nie rozstrzygam ZAŁOŻENIEM, bo każda opcja zmienia asercje lub allowlistę.
RUNDY: 1/5
NASTĘPNY KROK: Final Control: zatwierdzić wyjątek allowlisty (derived.rs) i wskazać kierunek dla 4 testów kodyfikujących edb8fb56 oraz dla regeneracji p6_4; następnie runda 2 (regeneracja wektorów p6_4 z 91dc998a, Operator-pomiary: mutacje ≥20 na gałęziach isKnown/embarkation/egipt/zulusi/AI-resolvers — NIE WYKONANO w tej rundzie).
DEPLOY/PUSH: NIE WYKONANO

Szczegóły mapowania web→Rust, założeń i listy poza zakresem: dyspozycje/rust-port/p6/P6-REPIN-LOGIKA-CIV.md.
Commit: a7590add (kod + tabele + dokumenty; raport dopisany osobnym commitem)

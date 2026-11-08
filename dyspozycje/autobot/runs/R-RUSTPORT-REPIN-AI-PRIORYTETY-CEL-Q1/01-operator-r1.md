STATUS: PASS-WITH-NOTES (GOAL CZĘŚCIOWY: partie 1-3 zrobione; (a) planHomeWar NIE zrobione)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-AI-PRIORYTETY-CEL-Q1
GOAL: REPIN zmian weba AI: (a) FALA 551 AIDRA (priorytety obrony), (b) FALA 553 NEARCITY (cel = najbliższe miasto), (c) FALA 558 ERAPOOL (pula wojen epoki gracza).
BAZA: origin/rust-port/parity-v2 = d6414fcf1 (detach). Web: origin/main 14f2af1b0.
RUNDA: 1/5

ZMIANY-COMMIT: patrz sekcja COMMIT na końcu (SHA po commicie). Allowlista: domain/war_*.rs (3 nowe), domain/mod.rs (+3 pub mod), domain/state.rs (pole City::founded_by), tests/p6_repin_ai_* (3 pliki + JSON), dyspozycje/rust-port/p6/P6-REPIN-AI-PRIORYTETY-CEL.md, dyspozycje/autobot/runs/R-RUSTPORT-.../**.
Poza allowlistą (ODSTĘPSTWO, jednolinijkowe): tests/p6_6b_vectors/common.rs -- dodano `founded_by: v["foundedBy"].as_i64()`, bo literał City bez tego pola nie kompiluje się (jedyne miejsce w 166 literałach).

POMIAR (tabela w P6-REPIN-AI-PRIORYTETY-CEL.md):
- (a) cityFounderId/isCityLostOf/foundedBy: BRAK -> zrobione (war_city_founder.rs, City::founded_by).
- (a) planHomeWar (ai-war-home-defense.ts:254, 458 linii, stateful): BRAK -> NIE zrobione.
- (b) isNearestCityWarPair/buildWarCityTargets: BRAK -> zrobione (war_target_select.rs); nearestTarget z tie-breakiem defenders -> zrobione jako osobna funkcja.
- (c) isPlayerEligibleForEraWarPool/isPlayerEraWarSlotFree + helpery epok: BRAK -> zrobione (war_era_pool.rs).
- Już w Rust (bez zmian): canCivJoinEraForcedWar, evaluateEraForcedWarGate, isWarTreatyBlocked, progi 20/20, rebuild/restore liczników.

ZAŁOŻENIA / ODSTĘPSTWA (do akceptacji):
1. WarCapitalTarget NIE dostał pola `defenders` (dotknęłoby 4 pliki testów spoza allowlisty). Tie-break w osobnym typie WarCityTarget.
2. Planer plan_war_all_in_capital NIE jest podpięty do nearest_war_city_target (decyzja: pole w WarCapitalTarget czy osobny typ).
3. Progi puli i limit per cywilizacja = stałe Rust (20/20, 1), nie parametr WarRulesParams.
4. foundedBy: czytnik zapisu miast w Rust nie istnieje (ani foundedByOwner), więc round-trip zapisu web->Rust nie jest objęty.
5. Wektory cityFounderId/isCityLostOf są ręczne (cities.ts nie generuje się tym samym sposobem).

WEKTORY: tests/p6_repin_ai_war_vectors.json wygenerowane z uruchomionego weba (Node 22 stripTypeScriptTypes, origin/main; jedyny patch: import JSON -> literał): 560 przypadków puli, 84 slotu, tagi, licznik, 4 scenariusze celów.

TESTY (na HEAD partii, przed commitem; po ostatniej zmianie kodu):
- rustfmt --check nowych plików: zielone.
- cargo clippy --all-targets -- -D warnings: rc=0.
- cargo test (309 binarek): 0 failed. Przebieg 1: 206 binarek, 1535 passed. Przebieg 2: pozostałe 103 binarki uruchomione bezpośrednio, wszystkie test result: ok, 0 failed.
- Nowe: p6_repin_ai_war_vectors 4/4 ok, p6_repin_ai_founded_by 3/3 ok.
- #[ignore]: 1 w bazie (p6_order_lane), 1 po zmianach -- zero nowych.
- Uwaga: cargo test uruchomiony w jednym wywołaniu przekroczył limit 590 s; resztę dokończono ręcznie (ta sama binarka, ten sam kod).

BLOKADY:
- GOAL (a) planHomeWar nie zportowany: wymaga min. 2 partii (A: stałe + ocena siły + klastry; B: plan P1/P2/P3 + histereza), zależności: RuntimeUnit, estimateUnitCombatStrength, isFieldUnit/distance jako callbacki.
- Brak czytnika zapisu miast (foundedBy).

RUNDY: 1/5
NASTĘPNY KROK: runda 2 tego samego ID: partia 4A/4B planHomeWar (ai-war-home-defense.ts) z wektorami z weba (generator jak w p6_repin_ai_war_vectors); decyzja o podpięciu defenders do planera (ZAŁOŻENIE: osobny typ, do akceptacji).
DEPLOY/PUSH: NIE WYKONANO

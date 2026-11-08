STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-FORCED-WAR-MODULES-Q1
GOAL: Partia G wielowojenności — port modułów wojen wymuszonych. Runda 1 = pomiar + partia G1 (części czyste forced-war-common.ts i forced-war-stone.ts). G2/G3 nieportowane (patrz BLOKADY).
BAZA: origin/rust-port/parity-v2 = d3e4d4df2 (detach). Web: origin/main, pliki gra/src/game/forced-war-*.ts, war-rules-multiwar.ts (wyciąg poza repo).

ZMIANY/COMMIT: 8c0d758fd (jedna partia G1, 374 LOC Rust bez JSON wektorów)
- rust-port/engine/src/domain/war_forced_common.rs (nowy, 115 l.): pickForcedWarTargetId, shouldEndForcedWarByCityCount, countActiveWarsExcluding, isRestingFromForcedWar, countActiveForcedWarsForOwner, isForcedEraPeaceLocked, isForcedWarRelationBlocked + próg 100
- rust-port/engine/src/domain/war_forced_stone.rs (nowy, 51 l.): stałe WOJNA_KAMIEN_*, isEligibleForStoneForcedWar, pickStoneForcedWarTargetId, isRestingFromStoneForcedWar
- rust-port/engine/src/domain/mod.rs (+2 linie pub mod)
- rust-port/engine/tests/p6_forced_war_g1.rs (nowy) + tests/p6_forced_war_g1_data/cases.json (208 wektorów wygenerowanych z uruchomionego weba, Node 22 --experimental-strip-types; jedyny patch: rozszerzenie .ts w imporcie stone -> common)
- dyspozycje/rust-port/p6/P6-FORCED-WAR-MODULES.md (nowy): tabela pomiaru + plan G2/G3
- Allowlista zachowana. Poza allowlistą: brak. Nie tknięto gra/**, WERSJE.md, Cargo.toml, renderer, src-tauri.

POMIAR (wynik): 33 eksporty war-rules-multiwar.ts + moduły diplomacy_multiwar*/war_era_pool/war_rules_multiwar już zawierały odpowiedniki (ERADELAY, ERAIGN, ERAPOOL, REPIN-WOJNA-NOWE-D). Realna luka to forced-war-*.ts (1498 linii TS): common (część czysta + serializacja/pairing), bronze, iron, stone, waves. Trigger/timer wejścia AI w epokę siedzi w main.ts — poza allowlistą.

TESTY:
- cargo fmt --check: OK (po rustfmt na nowych plikach)
- cargo clippy --all-targets -D warnings: OK (bez ostrzeżeń)
- cargo test --test p6_forced_war_g1: 1 passed, 0 failed (208 wektorów)
- cargo test --lib: 22 passed, 0 failed
- cargo test --test diplomacy --test 'p6_dyplo*' --test 'p6_dyplomacja*' --test 'p6_forced_war*' --test 'p6_m*': EXIT 0, 111 binarek "ok", 0 FAILED, 0 nowych #[ignore]
- NIE_ZMIERZONO: pełny przebieg wszystkich 318 binarek tests/ (ograniczenie czasu rundy; zmiana addytywna: 2 nowe moduły + 2 linie mod.rs)
- Dysk: start 8,1 GB wolne (/); target-p6fw usunięty po bramkach; Cargo.lock wygenerowany przez cargo (untracked) usunięty, nie commitowany.

BLOKADY:
- G2 (do zrobienia): forced-war-common.ts 186–537 (assignForcedWarPairings, restore/serialize stanu i blokad pokoju) + forced-war-bronze.ts (eligibility, pick, rest) + forced-war-iron.ts (eligibility, isIronEraEntry, pick, rest). Szacunek 500–600 LOC.
- G3 (do zrobienia): forced-war-waves.ts (planForcedWarWave, pruneForcedWarWaves, approachSectorForHex, hexDistanceForForcedWar) oraz timer/trigger w main.ts (ERADELAY) — poza allowlistą; wymaga decyzji o przeniesieniu logiki do domain/war_*.rs.
- Brak podpięcia do tury (zgodnie z dispatchem).

ODSTĘPSTWA OD WEBU (ZAŁOŻENIA do akceptacji):
1. pickForcedWarTargetId przyjmuje referencję jako Option<(i32,i32)> i odległość jako funkcję (zamiast obiektu hex); semantyka remisów 1:1.
2. Stałe WAR_RULES_PARAMS zamiast JSON (zgodnie z istniejącą praktyką diplomacy_multiwar*).
3. WOJNA_KAMIEN_WYMUSZONA_MAX_CZAS_TRWANIA_TUR i API setterów flag (setWarRulesMultiwarOverride itp.) NIE portowane — w webie nieużywane w runtime / tylko do testów.
4. Serializacja/restore stanu (Map -> Vec) przeniesiona do G2.

NASTĘPNY KROK: Evaluator (Sonnet 5.5) na 8c0d758fd, potem Final Control; kolejna runda Operatora = G2 (bronze/iron/pairing) po integracji G1 przez orkiestratora.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

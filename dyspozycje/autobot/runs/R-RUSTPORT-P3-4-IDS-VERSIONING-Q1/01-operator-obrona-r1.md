STATUS: PASS-WITH-NOTES (częściowo; newtypy zablokowane allowlistą — patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-4-IDS-VERSIONING-Q1
GOAL: Newtypy ID w PlayablePlayer/CombatUnit/AiUnit/BarbUnit + SCHEMA_VERSION; zielone testy.
ZMIANY/COMMIT: rust-port/engine/src/version.rs (nowy), rust-port/engine/src/lib.rs (+pub mod version), dyspozycje/rust-port/p3/P3-4-IDS-VERSIONING.md (nowy), ten plik. Commit w worktree, bez push.
TESTY: cargo check --all-targets przed: EXIT=0; po: EXIT=0, 0 warningów. cargo test NIE uruchomiony (dysk / 100%, brak miejsca na build testów). Log: scratchpad check-baseline.log, check-after.log.
BLOKADY: (1) newtypy wymagają zmian poza allowlistą: bridge.rs:347, tests/combat.rs:10, tests/ai_turn.rs, tests/barbarians.rs. (2) baza z dispatchu (2c518a12 jako HEAD po P3.3-IMPL) niezgodna z historią — 766333c4 nie jest przodkiem; worktree na origin/rust-port/parity-v2 e72c74f7. (3) ścieżka ids.rs w dispatchu błędna: właściwa rust-port/engine/src/domain/ids.rs. (4) P2-3-ENTITY-IDS.md nie istnieje w origin/rust-port/parity-v2 (istnieje tylko w checkoucie głównym /home/user/The-Game/dyspozycje/rust-port/p2/, nieśledzony w tej gałęzi); nieprzeczytany w tej rundzie w wersji zatwierdzonej — odnotowane.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator — zweryfikować SCHEMA_VERSION; orkiestrator decyduje o rozszerzeniu allowlisty (P3.4b) albo o rozbiciu tematu.
DEPLOY/PUSH: NIE WYKONANO
